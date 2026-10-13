begin;

alter table public.pagarme_webhook_events
  add column source text not null default 'webhook';

alter table public.pagarme_webhook_events
  add constraint pagarme_webhook_events_source_check
  check (source in ('webhook', 'reconciliation'));

create index subscriptions_pagarme_reconciliation_candidates_idx
  on public.subscriptions (current_period_end, id)
  where status in ('active', 'trial', 'past_due')
    and external_id like 'sub\_%' escape '\';

create or replace function public.process_pagarme_subscription_renewal(
  p_webhook_event_id uuid,
  p_subscription_external_id text,
  p_invoice_external_id text,
  p_invoice_amount integer,
  p_invoice_status text,
  p_payment_method text,
  p_period_start timestamptz,
  p_period_end timestamptz,
  p_next_billing_at timestamptz,
  p_paid_at timestamptz default null
)
returns jsonb
language plpgsql
set search_path to ''
as $$
declare
  v_event public.pagarme_webhook_events%rowtype;
  v_subscription public.subscriptions%rowtype;
  v_contract public.subscription_contracts%rowtype;
  v_current_plan public.plans%rowtype;
  v_effective_plan public.plans%rowtype;
  v_payment public.student_payments%rowtype;
  v_expiration public.credit_transactions%rowtype;
  v_grant public.credit_transactions%rowtype;
  v_payment_id uuid;
  v_paid_at timestamptz;
  v_plan_balance integer := 0;
  v_expired_credits integer := 0;
  v_effective_payment_method text;
  v_effective_plan_id uuid;
  v_effective_plan_name text;
  v_effective_price integer;
  v_effective_credits integer;
  v_effective_contract_id uuid;
  v_effective_contract_version integer;
  v_terms_source text := 'subscription_contract';
  v_apply_downgrade boolean := false;
  v_period_already_applied boolean := false;
  v_expiration_applied boolean := false;
  v_payment_created boolean := false;
  v_payment_changed boolean := false;
  v_expiration_created boolean := false;
  v_grant_created boolean := false;
  v_subscription_changed boolean := false;
begin
  if coalesce(auth.jwt() ->> 'role', '') <> 'service_role' then
    raise exception 'Acesso não autorizado.';
  end if;

  if p_webhook_event_id is null
    or nullif(btrim(p_subscription_external_id), '') is null
    or nullif(btrim(p_invoice_external_id), '') is null
  then
    raise exception 'Identificadores da renovação não informados.';
  end if;

  if p_invoice_status <> 'paid' then
    raise exception 'A fatura informada não está paga.';
  end if;

  if p_invoice_amount is null or p_invoice_amount <= 0 then
    raise exception 'O valor da fatura deve ser maior que zero.';
  end if;

  if p_period_start is null
    or p_period_end is null
    or p_period_end <= p_period_start
  then
    raise exception 'O período da renovação é inválido.';
  end if;

  if p_next_billing_at is null or p_next_billing_at <= p_period_start then
    raise exception 'A próxima data de cobrança é inválida.';
  end if;

  v_paid_at := coalesce(p_paid_at, now());

  select *
  into v_event
  from public.pagarme_webhook_events
  where id = p_webhook_event_id
  for update;

  if not found then
    raise exception 'Evento de processamento não encontrado.';
  end if;

  if v_event.event_type <> 'invoice.paid' then
    raise exception 'O evento informado não é uma renovação paga.';
  end if;

  if nullif(v_event.payload #>> '{data,id}', '')
    is distinct from p_invoice_external_id
  then
    raise exception 'A fatura informada não corresponde ao evento.';
  end if;

  if nullif(v_event.payload #>> '{data,subscription,id}', '')
    is distinct from p_subscription_external_id
  then
    raise exception 'A assinatura informada não corresponde ao evento.';
  end if;

  update public.pagarme_webhook_events
  set status = 'processing', error_message = null, updated_at = now()
  where id = p_webhook_event_id;

  select *
  into v_subscription
  from public.subscriptions
  where external_id = p_subscription_external_id
  for update;

  if not found then
    raise exception 'Assinatura local não encontrada.';
  end if;

  if v_subscription.status not in ('active', 'trial', 'past_due') then
    raise exception 'O status atual da assinatura não permite renovação.';
  end if;

  if v_subscription.cancel_at_period_end then
    raise exception 'A assinatura está programada para cancelamento.';
  end if;

  select contract.*
  into v_contract
  from public.subscription_contracts as contract
  where contract.subscription_id = v_subscription.id
    and contract.status = 'active'
    and contract.billing_mode = 'recurring'
    and contract.effective_at <= p_period_start
    and (contract.ended_at is null or contract.ended_at > p_period_start)
  for update;

  if not found then
    raise exception 'Contrato recorrente ativo e vigente não encontrado; reconciliação manual necessária.';
  end if;

  v_apply_downgrade :=
    v_subscription.pending_change_type = 'downgrade'
    and v_subscription.pending_plan_id is not null
    and v_subscription.pending_change_at is not null
    and v_subscription.pending_change_at <= v_paid_at;

  if v_apply_downgrade then
    select * into v_current_plan
    from public.plans
    where id = v_subscription.plan_id;

    if not found then
      raise exception 'Plano atual da assinatura não encontrado para o downgrade legado.';
    end if;

    select * into v_effective_plan
    from public.plans
    where id = v_subscription.pending_plan_id
      and is_active = true;

    if not found or v_effective_plan.price >= v_current_plan.price then
      raise exception 'O plano agendado não representa um downgrade válido.';
    end if;

    v_effective_plan_id := v_effective_plan.id;
    v_effective_plan_name := v_effective_plan.name;
    v_effective_price := v_effective_plan.price;
    v_effective_credits := v_effective_plan.credits_included;
    v_effective_contract_id := null;
    v_effective_contract_version := null;
    v_terms_source := 'legacy_pending_downgrade_plan';
  else
    if v_subscription.plan_id is distinct from v_contract.plan_id then
      raise exception 'O plano operacional diverge do contrato ativo; intervenção necessária.';
    end if;

    v_effective_plan_id := v_contract.plan_id;
    v_effective_plan_name := v_contract.plan_name;
    v_effective_price := v_contract.price_cents;
    v_effective_credits := v_contract.credits_included;
    v_effective_contract_id := v_contract.id;
    v_effective_contract_version := v_contract.version;
  end if;

  if p_invoice_amount <> v_effective_price then
    raise exception 'O valor da fatura não corresponde ao valor contratado.';
  end if;

  v_effective_payment_method := coalesce(v_subscription.payment_method, p_payment_method);

  if v_effective_payment_method not in ('credit_card', 'debit_card', 'boleto') then
    raise exception 'Método de pagamento inválido para a renovação.';
  end if;

  v_period_already_applied :=
    v_subscription.current_period_start is not distinct from p_period_start
    and v_subscription.current_period_end is not distinct from p_period_end;

  if not v_period_already_applied then
    if v_subscription.current_period_end is null then
      raise exception 'O fim do período local não está disponível para validar a continuidade; intervenção necessária.';
    end if;

    if (v_subscription.current_period_start is not null
        and v_subscription.current_period_start > p_period_start)
      or (v_subscription.current_period_end is not null
        and v_subscription.current_period_end > p_period_end)
      or (v_subscription.current_period_end is not null
        and p_period_start < v_subscription.current_period_end)
      or (v_subscription.current_period_end is not null
        and p_period_start > v_subscription.current_period_end + interval '1 second')
    then
      raise exception 'O período remoto é anterior, sobreposto ou possui lacuna em relação ao período local; intervenção necessária.';
    end if;
  end if;

  select payment.*
  into v_payment
  from public.student_payments as payment
  where payment.provider = 'pagarme'
    and payment.external_id = p_invoice_external_id
  for update;

  if found then
    if v_payment.subscription_id is distinct from v_subscription.id
      or v_payment.user_id is distinct from v_subscription.user_id
      or v_payment.kind <> 'subscription'
    then
      raise exception 'A fatura já está vinculada a outro pagamento ou assinatura.';
    end if;

    if v_payment.amount is distinct from p_invoice_amount
      or (v_payment.plan_id is not null
        and v_payment.plan_id is distinct from v_effective_plan_id)
    then
      raise exception 'O pagamento existente diverge dos termos da fatura.';
    end if;

    v_payment_id := v_payment.id;
    v_payment_changed :=
      v_payment.status is distinct from 'paid'
      or v_payment.plan_id is distinct from v_effective_plan_id
      or v_payment.payment_method is distinct from v_effective_payment_method
      or v_payment.paid_at is null;

    if v_payment_changed then
      update public.student_payments
      set
        plan_id = v_effective_plan_id,
        status = 'paid',
        payment_method = v_effective_payment_method,
        paid_at = coalesce(paid_at, v_paid_at),
        updated_at = now()
      where id = v_payment_id;
    end if;
  else
    insert into public.student_payments (
      user_id,
      subscription_id,
      plan_id,
      payment_card_id,
      kind,
      provider,
      external_id,
      amount,
      credits_amount,
      status,
      payment_method,
      paid_at,
      idempotency_key,
      metadata
    ) values (
      v_subscription.user_id,
      v_subscription.id,
      v_effective_plan_id,
      v_subscription.payment_card_id,
      'subscription',
      'pagarme',
      p_invoice_external_id,
      p_invoice_amount,
      v_effective_credits,
      'paid',
      v_effective_payment_method,
      v_paid_at,
      'pagarme-renewal:' || p_invoice_external_id,
      jsonb_build_object(
        'provider', 'pagarme',
        'source', v_event.source,
        'processing_event_id', p_webhook_event_id,
        'pagarme_invoice_id', p_invoice_external_id,
        'pagarme_subscription_id', p_subscription_external_id,
        'invoice_status', p_invoice_status,
        'previous_plan_id', v_subscription.plan_id,
        'effective_plan_id', v_effective_plan_id,
        'contract_id', v_effective_contract_id,
        'contract_version', v_effective_contract_version,
        'terms_source', v_terms_source,
        'period_start', p_period_start,
        'period_end', p_period_end,
        'next_billing_at', p_next_billing_at
      )
    ) returning id into v_payment_id;

    v_payment_created := true;

    select * into v_payment
    from public.student_payments
    where id = v_payment_id;
  end if;

  /*
   * Compatibilidade temporária: o consumo em produção ainda usa
   * student_credits/credit_transactions. Não criamos allocations sombra,
   * pois elas divergiriam enquanto submit_essay não consumir o novo ledger.
   * A invoice e o payment formam a evidência determinística deste ciclo.
   */

  select transaction.*
  into v_expiration
  from public.credit_transactions as transaction
  where transaction.student_payment_id = v_payment_id
    and transaction.type = 'plan_expiration';

  if found and v_expiration.amount >= 0 then
    raise exception 'A expiração existente para a fatura é inválida.';
  end if;

  select transaction.*
  into v_grant
  from public.credit_transactions as transaction
  where transaction.student_payment_id = v_payment_id
    and transaction.type = 'plan_renewal';

  if found and v_grant.amount is distinct from v_effective_credits then
    raise exception 'A concessão existente diverge dos créditos contratados.';
  end if;

  v_expiration_applied :=
    coalesce(v_payment.metadata ->> 'renewal_expiration_applied', 'false') = 'true'
    or v_expiration.id is not null;

  if not v_expiration_applied then
    if v_grant.id is not null then
      if not v_period_already_applied then
        raise exception 'Concessão existente sem evidência de expiração; intervenção necessária.';
      end if;

      v_expiration_applied := true;
    else
      select credits.plan_credits
      into v_plan_balance
      from public.student_credits as credits
      where credits.user_id = v_subscription.user_id
      for update;

      v_plan_balance := coalesce(v_plan_balance, 0);
      v_expired_credits := v_plan_balance;

      if v_plan_balance > 0 then
        insert into public.credit_transactions (
          user_id, type, amount, description, student_payment_id, metadata
        ) values (
          v_subscription.user_id,
          'plan_expiration',
          -v_plan_balance,
          format('Expiração de %s crédito(s) restantes do plano %s.', v_plan_balance, v_contract.plan_name),
          v_payment_id,
          jsonb_build_object(
            'source', v_event.source,
            'processing_event_id', p_webhook_event_id,
            'credit_type', 'plan',
            'grant_type', 'subscription_cycle_expiration',
            'subscription_id', v_subscription.id,
            'contract_id', v_contract.id,
            'contract_version', v_contract.version,
            'plan_id', v_contract.plan_id,
            'previous_period_start', v_subscription.current_period_start,
            'previous_period_end', v_subscription.current_period_end,
            'pagarme_invoice_id', p_invoice_external_id
          )
        );

        v_expiration_created := true;
      end if;

      v_expiration_applied := true;
    end if;
  end if;

  if v_effective_credits > 0 and v_grant.id is null then
    insert into public.credit_transactions (
      user_id, type, amount, description, student_payment_id, metadata
    ) values (
      v_subscription.user_id,
      'plan_renewal',
      v_effective_credits,
      format('Liberação de %s crédito(s) pela renovação do plano %s.', v_effective_credits, v_effective_plan_name),
      v_payment_id,
      jsonb_build_object(
        'source', v_event.source,
        'processing_event_id', p_webhook_event_id,
        'credit_type', 'plan',
        'grant_type', 'subscription_renewal_cycle',
        'subscription_id', v_subscription.id,
        'contract_id', v_effective_contract_id,
        'contract_version', v_effective_contract_version,
        'active_contract_id', v_contract.id,
        'active_contract_version', v_contract.version,
        'plan_id', v_effective_plan_id,
        'plan_name', v_effective_plan_name,
        'terms_source', v_terms_source,
        'period_start', p_period_start,
        'period_end', p_period_end,
        'next_billing_at', p_next_billing_at,
        'pagarme_invoice_id', p_invoice_external_id,
        'downgrade_applied', v_apply_downgrade
      )
    );

    v_grant_created := true;
  end if;

  update public.student_payments
  set metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
        'renewal_expiration_applied', true,
        'renewal_expired_credits', case
          when v_expiration.id is not null then -v_expiration.amount
          else v_expired_credits
        end,
        'renewal_grant_applied', v_effective_credits = 0 or v_grant.id is not null or v_grant_created,
        'renewal_period_start', p_period_start,
        'renewal_period_end', p_period_end
      ),
      updated_at = case
        when metadata @> jsonb_build_object(
          'renewal_expiration_applied', true,
          'renewal_grant_applied', v_effective_credits = 0 or v_grant.id is not null or v_grant_created,
          'renewal_period_start', p_period_start,
          'renewal_period_end', p_period_end
        ) then updated_at
        else now()
      end
  where id = v_payment_id;

  v_subscription_changed :=
    not v_period_already_applied
    or v_subscription.next_billing_at is distinct from p_next_billing_at
    or v_subscription.status is distinct from 'active'
    or v_subscription.plan_id is distinct from v_effective_plan_id
    or (v_apply_downgrade and v_subscription.pending_plan_id is not null)
    or v_subscription.metadata ->> 'last_pagarme_invoice_id'
      is distinct from p_invoice_external_id;

  if v_subscription_changed then
    update public.subscriptions
    set
      plan_id = v_effective_plan_id,
      status = 'active',
      current_period_start = p_period_start,
      current_period_end = p_period_end,
      next_billing_at = p_next_billing_at,
      pending_plan_id = case when v_apply_downgrade then null else pending_plan_id end,
      pending_change_type = case when v_apply_downgrade then null else pending_change_type end,
      pending_change_at = case when v_apply_downgrade then null else pending_change_at end,
      metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
        'last_pagarme_invoice_id', p_invoice_external_id,
        'last_renewal_payment_id', v_payment_id,
        'last_renewed_at', v_paid_at,
        'previous_plan_id', v_subscription.plan_id,
        'effective_plan_id', v_effective_plan_id,
        'last_renewal_contract_id', v_effective_contract_id,
        'last_renewal_contract_version', v_effective_contract_version,
        'last_renewal_terms_source', v_terms_source,
        'last_renewal_source', v_event.source,
        'downgrade_applied', v_apply_downgrade,
        'next_billing_at', p_next_billing_at
      ),
      updated_at = now()
    where id = v_subscription.id;
  end if;

  update public.pagarme_webhook_events
  set
    status = 'processed',
    processed_at = coalesce(processed_at, now()),
    error_message = null,
    updated_at = case
      when status = 'processed' and error_message is null then updated_at
      else now()
    end
  where id = p_webhook_event_id;

  return jsonb_build_object(
    'success', true,
    'duplicate', not (
      v_payment_created
      or v_payment_changed
      or v_expiration_created
      or v_grant_created
      or v_subscription_changed
    ),
    'payment_created', v_payment_created,
    'payment_id', v_payment_id,
    'expiration_created', v_expiration_created,
    'grant_created', v_grant_created,
    'subscription_updated', v_subscription_changed,
    'subscription_id', v_subscription.id,
    'previous_plan_id', v_subscription.plan_id,
    'effective_plan_id', v_effective_plan_id,
    'contract_id', v_effective_contract_id,
    'contract_version', v_effective_contract_version,
    'terms_source', v_terms_source,
    'downgrade_applied', v_apply_downgrade,
    'expired_credits', v_expired_credits,
    'granted_credits', case when v_grant_created then v_effective_credits else 0 end,
    'period_start', p_period_start,
    'period_end', p_period_end,
    'next_billing_at', p_next_billing_at,
    'processing_source', v_event.source
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

commit;
