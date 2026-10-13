begin;

create function public.finalize_extra_credit_purchase(
  p_webhook_event_id uuid,
  p_payment_id uuid,
  p_user_id uuid,
  p_order_external_id text,
  p_order_amount integer,
  p_order_status text,
  p_charge_external_id text,
  p_charge_status text,
  p_paid_at timestamptz
)
returns jsonb
language plpgsql
set search_path to ''
as $$
declare
  v_event public.pagarme_webhook_events%rowtype;
  v_payment public.student_payments%rowtype;
  v_transaction public.credit_transactions%rowtype;
  v_transaction_id uuid;
  v_package_id text;
  v_payment_changed boolean := false;
  v_grant_created boolean := false;
begin
  if coalesce(auth.jwt() ->> 'role', '') <> 'service_role' then
    raise exception 'Acesso não autorizado.';
  end if;

  if p_webhook_event_id is null
    or p_payment_id is null
    or p_user_id is null
    or p_order_external_id !~ '^or_[A-Za-z0-9]+$'
    or p_charge_external_id !~ '^ch_[A-Za-z0-9]+$'
  then
    raise exception 'Identificadores da compra não informados ou inválidos.';
  end if;

  if p_order_status <> 'paid' or p_charge_status <> 'paid' then
    raise exception 'O pedido e a cobrança informados não estão pagos.';
  end if;

  if p_order_amount is null or p_order_amount <= 0 or p_paid_at is null then
    raise exception 'Os dados financeiros do pedido pago são inválidos.';
  end if;

  select *
  into v_event
  from public.pagarme_webhook_events
  where id = p_webhook_event_id
  for update;

  if not found then
    raise exception 'Evento de processamento não encontrado.';
  end if;

  if v_event.event_type <> 'order.paid' then
    raise exception 'O evento informado não confirma um pedido pago.';
  end if;

  if nullif(v_event.payload #>> '{data,id}', '') is distinct from p_order_external_id
    or nullif(v_event.payload #>> '{data,status}', '') is distinct from 'paid'
    or nullif(v_event.payload #>> '{data,amount}', '') is distinct from p_order_amount::text
    or nullif(v_event.payload #>> '{data,metadata,local_payment_id}', '')
      is distinct from p_payment_id::text
    or nullif(v_event.payload #>> '{data,metadata,user_id}', '')
      is distinct from p_user_id::text
    or nullif(v_event.payload #>> '{data,metadata,source}', '')
      is distinct from 'extra_credit_purchase'
  then
    raise exception 'O pedido pago não corresponde ao evento verificado.';
  end if;

  update public.pagarme_webhook_events
  set status = 'processing', error_message = null, updated_at = now()
  where id = p_webhook_event_id;

  select *
  into v_payment
  from public.student_payments
  where id = p_payment_id
  for update;

  if not found then
    raise exception 'Compra de créditos extras não encontrada.';
  end if;

  if v_payment.user_id <> p_user_id
    or v_payment.kind <> 'extra_credits'
    or v_payment.provider <> 'pagarme'
    or v_payment.payment_method <> 'credit_card'
  then
    raise exception 'A compra local não corresponde ao pagamento informado.';
  end if;

  if v_payment.external_id is not null
    and v_payment.external_id <> p_order_external_id
  then
    raise exception 'A compra local está vinculada a outro pedido.';
  end if;

  if v_payment.amount <> p_order_amount then
    raise exception 'O valor do pedido diverge do snapshot da compra.';
  end if;

  if v_payment.credits_amount is null or v_payment.credits_amount <= 0 then
    raise exception 'A compra local não possui uma quantidade válida de créditos.';
  end if;

  v_package_id := nullif(v_payment.metadata ->> 'extra_credit_package_id', '');

  if v_package_id is null
    or v_payment.metadata ->> 'source' is distinct from 'extra_credit_purchase'
    or nullif(v_event.payload #>> '{data,metadata,extra_credit_package_id}', '')
      is distinct from v_package_id
    or nullif(v_event.payload #>> '{data,metadata,credits_amount}', '')
      is distinct from v_payment.credits_amount::text
  then
    raise exception 'O pacote do pedido diverge do snapshot da compra.';
  end if;

  v_payment_changed := v_payment.status <> 'paid'
    or v_payment.external_id is distinct from p_order_external_id
    or v_payment.paid_at is null;

  update public.student_payments
  set
    external_id = p_order_external_id,
    status = 'paid',
    paid_at = coalesce(paid_at, p_paid_at),
    metadata = metadata || jsonb_build_object(
      'pagarme_order_id', p_order_external_id,
      'pagarme_order_status', p_order_status,
      'pagarme_charge_id', p_charge_external_id,
      'pagarme_charge_status', p_charge_status,
      'payment_finalized_at', now(),
      'payment_finalized_by', 'pagarme_webhook'
    ),
    updated_at = now()
  where id = v_payment.id;

  select *
  into v_transaction
  from public.credit_transactions as transaction
  where transaction.student_payment_id = v_payment.id
    and transaction.type = 'standalone_purchase'
  for update;

  if found then
    if v_transaction.user_id <> v_payment.user_id
      or v_transaction.amount <> v_payment.credits_amount
    then
      raise exception 'A concessão existente diverge da compra de créditos extras.';
    end if;

    v_transaction_id := v_transaction.id;
  else
    insert into public.credit_transactions (
      user_id,
      type,
      amount,
      description,
      metadata,
      student_payment_id
    )
    values (
      v_payment.user_id,
      'standalone_purchase',
      v_payment.credits_amount,
      'Compra de créditos extras',
      jsonb_build_object(
        'credit_type', 'extra',
        'source', 'extra_credit_purchase',
        'extra_credit_package_id', v_package_id,
        'pagarme_order_id', p_order_external_id
      ),
      v_payment.id
    )
    on conflict (student_payment_id, type)
      where student_payment_id is not null
    do nothing
    returning id into v_transaction_id;

    v_grant_created := v_transaction_id is not null;

    if not v_grant_created then
      select *
      into v_transaction
      from public.credit_transactions as transaction
      where transaction.student_payment_id = v_payment.id
        and transaction.type = 'standalone_purchase'
      for update;

      if not found
        or v_transaction.user_id <> v_payment.user_id
        or v_transaction.amount <> v_payment.credits_amount
      then
        raise exception 'Não foi possível convergir a concessão de créditos extras.';
      end if;

      v_transaction_id := v_transaction.id;
    end if;
  end if;

  update public.pagarme_webhook_events
  set
    status = 'processed',
    processed_at = coalesce(processed_at, now()),
    error_message = null,
    updated_at = now()
  where id = p_webhook_event_id;

  return jsonb_build_object(
    'success', true,
    'duplicate', not (v_payment_changed or v_grant_created),
    'payment_changed', v_payment_changed,
    'grant_created', v_grant_created,
    'payment_id', v_payment.id,
    'credit_transaction_id', v_transaction_id,
    'granted_credits', case when v_grant_created then v_payment.credits_amount else 0 end
  );
exception
  when others then
    update public.pagarme_webhook_events
    set status = 'failed', error_message = sqlerrm, updated_at = now()
    where id = p_webhook_event_id;

    return jsonb_build_object(
      'success', false,
      'message', sqlerrm,
      'webhook_event_id', p_webhook_event_id
    );
end;
$$;

create function public.process_extra_credit_purchase_failure(
  p_webhook_event_id uuid,
  p_payment_id uuid,
  p_user_id uuid,
  p_order_external_id text,
  p_order_amount integer,
  p_order_status text,
  p_failed_at timestamptz default null
)
returns jsonb
language plpgsql
set search_path to ''
as $$
declare
  v_event public.pagarme_webhook_events%rowtype;
  v_payment public.student_payments%rowtype;
  v_payment_changed boolean := false;
  v_has_grant boolean := false;
begin
  if coalesce(auth.jwt() ->> 'role', '') <> 'service_role' then
    raise exception 'Acesso não autorizado.';
  end if;

  if p_webhook_event_id is null
    or p_payment_id is null
    or p_user_id is null
    or p_order_external_id !~ '^or_[A-Za-z0-9]+$'
    or p_order_amount is null
    or p_order_amount <= 0
  then
    raise exception 'Os dados da falha do pedido são inválidos.';
  end if;

  select *
  into v_event
  from public.pagarme_webhook_events
  where id = p_webhook_event_id
  for update;

  if not found then
    raise exception 'Evento de processamento não encontrado.';
  end if;

  if v_event.event_type <> 'order.payment_failed' then
    raise exception 'O evento informado não representa falha de pedido.';
  end if;

  if nullif(v_event.payload #>> '{data,id}', '') is distinct from p_order_external_id
    or nullif(v_event.payload #>> '{data,amount}', '') is distinct from p_order_amount::text
    or nullif(v_event.payload #>> '{data,metadata,local_payment_id}', '')
      is distinct from p_payment_id::text
    or nullif(v_event.payload #>> '{data,metadata,user_id}', '')
      is distinct from p_user_id::text
    or nullif(v_event.payload #>> '{data,metadata,source}', '')
      is distinct from 'extra_credit_purchase'
  then
    raise exception 'O pedido com falha não corresponde ao evento verificado.';
  end if;

  update public.pagarme_webhook_events
  set status = 'processing', error_message = null, updated_at = now()
  where id = p_webhook_event_id;

  select *
  into v_payment
  from public.student_payments
  where id = p_payment_id
  for update;

  if not found then
    raise exception 'Compra de créditos extras não encontrada.';
  end if;

  if v_payment.user_id <> p_user_id
    or v_payment.kind <> 'extra_credits'
    or v_payment.provider <> 'pagarme'
    or v_payment.payment_method <> 'credit_card'
    or v_payment.amount <> p_order_amount
  then
    raise exception 'A compra local diverge do pedido com falha.';
  end if;

  if v_payment.external_id is not null
    and v_payment.external_id <> p_order_external_id
  then
    raise exception 'A compra local está vinculada a outro pedido.';
  end if;

  select exists (
    select 1
    from public.credit_transactions as transaction
    where transaction.student_payment_id = v_payment.id
      and transaction.type = 'standalone_purchase'
  ) into v_has_grant;

  if v_payment.status = 'paid' then
    update public.pagarme_webhook_events
    set
      status = 'processed',
      processed_at = coalesce(processed_at, now()),
      error_message = null,
      updated_at = now()
    where id = p_webhook_event_id;

    return jsonb_build_object(
      'success', true,
      'duplicate', true,
      'ignored', true,
      'reason', 'payment_already_paid',
      'payment_id', v_payment.id
    );
  end if;

  if p_order_status = 'paid' then
    update public.pagarme_webhook_events
    set
      status = 'processed',
      processed_at = coalesce(processed_at, now()),
      error_message = null,
      updated_at = now()
    where id = p_webhook_event_id;

    return jsonb_build_object(
      'success', true,
      'duplicate', false,
      'ignored', true,
      'reason', 'remote_order_is_paid',
      'payment_id', v_payment.id
    );
  end if;

  if p_order_status not in ('failed', 'canceled', 'cancelled', 'not_authorized', 'refused') then
    update public.pagarme_webhook_events
    set
      status = 'processed',
      processed_at = coalesce(processed_at, now()),
      error_message = null,
      updated_at = now()
    where id = p_webhook_event_id;

    return jsonb_build_object(
      'success', true,
      'duplicate', false,
      'ignored', true,
      'reason', 'remote_order_not_failed',
      'payment_id', v_payment.id
    );
  end if;

  if v_has_grant then
    raise exception 'Uma compra com créditos concedidos não pode ser marcada como falha.';
  end if;

  v_payment_changed := v_payment.status <> 'failed'
    or v_payment.external_id is distinct from p_order_external_id;

  update public.student_payments
  set
    external_id = p_order_external_id,
    status = 'failed',
    paid_at = null,
    metadata = metadata || jsonb_build_object(
      'pagarme_order_id', p_order_external_id,
      'pagarme_order_status', p_order_status,
      'payment_failed_at', coalesce(p_failed_at, now()),
      'payment_failure_source', 'pagarme_webhook'
    ),
    updated_at = now()
  where id = v_payment.id
    and status <> 'paid';

  update public.pagarme_webhook_events
  set
    status = 'processed',
    processed_at = coalesce(processed_at, now()),
    error_message = null,
    updated_at = now()
  where id = p_webhook_event_id;

  return jsonb_build_object(
    'success', true,
    'duplicate', not v_payment_changed,
    'ignored', false,
    'payment_changed', v_payment_changed,
    'payment_id', v_payment.id
  );
exception
  when others then
    update public.pagarme_webhook_events
    set status = 'failed', error_message = sqlerrm, updated_at = now()
    where id = p_webhook_event_id;

    return jsonb_build_object(
      'success', false,
      'message', sqlerrm,
      'webhook_event_id', p_webhook_event_id
    );
end;
$$;

revoke all on function public.finalize_extra_credit_purchase(
  uuid, uuid, uuid, text, integer, text, text, text, timestamptz
) from public, anon, authenticated;

grant execute on function public.finalize_extra_credit_purchase(
  uuid, uuid, uuid, text, integer, text, text, text, timestamptz
) to service_role;

revoke all on function public.process_extra_credit_purchase_failure(
  uuid, uuid, uuid, text, integer, text, timestamptz
) from public, anon, authenticated;

grant execute on function public.process_extra_credit_purchase_failure(
  uuid, uuid, uuid, text, integer, text, timestamptz
) to service_role;

commit;
