begin;

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
  v_webhook_event public.pagarme_webhook_events%rowtype;
  v_subscription public.subscriptions%rowtype;
  v_active_contract public.subscription_contracts%rowtype;

  /*
   * Mantidos exclusivamente para o downgrade legado.
   * O fluxo de downgrade ainda não cria contrato pending.
   */
  v_current_plan public.plans%rowtype;
  v_effective_plan public.plans%rowtype;

  v_existing_payment record;
  v_payment_id uuid;

  v_plan_balance integer := 0;
  v_apply_downgrade boolean := false;
  v_effective_payment_method text;
  v_effective_paid_at timestamptz;

  v_effective_plan_id uuid;
  v_effective_plan_name text;
  v_effective_price_cents integer;
  v_effective_credits integer;
  v_effective_contract_id uuid;
  v_effective_contract_version integer;
  v_terms_source text := 'subscription_contract';
begin
  if coalesce(auth.jwt() ->> 'role', '') <> 'service_role' then
    raise exception 'Acesso não autorizado.';
  end if;

  if p_subscription_external_id is null
    or p_invoice_external_id is null
  then
    raise exception 'Identificadores da renovação não informados.';
  end if;

  if p_invoice_status <> 'paid' then
    raise exception 'A fatura informada não está paga.';
  end if;

  if p_invoice_amount <= 0 then
    raise exception 'O valor da fatura deve ser maior que zero.';
  end if;

  if p_period_start is null
    or p_period_end is null
    or p_period_end <= p_period_start
  then
    raise exception 'O período da renovação é inválido.';
  end if;

  if p_next_billing_at is null then
    raise exception 'A próxima data de cobrança não foi informada.';
  end if;

  if p_next_billing_at <= p_period_start then
    raise exception 'A próxima data de cobrança é inválida.';
  end if;

  v_effective_paid_at := coalesce(
    p_paid_at,
    now()
  );

  /*
   * Bloqueia o evento durante o processamento para
   * impedir duas execuções simultâneas do mesmo webhook.
   */
  select *
  into v_webhook_event
  from public.pagarme_webhook_events
  where id = p_webhook_event_id
  for update;

  if not found then
    raise exception 'Evento de webhook não encontrado.';
  end if;

  if v_webhook_event.event_type <> 'invoice.paid' then
    raise exception 'O evento informado não é uma renovação paga.';
  end if;

  /*
   * Os parâmetros recebidos precisam corresponder ao
   * payload autenticado e armazenado para o webhook.
   */
  if nullif(
    v_webhook_event.payload #>> '{data,id}',
    ''
  ) is distinct from p_invoice_external_id
  then
    raise exception
      'A fatura informada não corresponde ao evento de webhook.';
  end if;

  if nullif(
    v_webhook_event.payload #>> '{data,subscription,id}',
    ''
  ) is distinct from p_subscription_external_id
  then
    raise exception
      'A assinatura informada não corresponde ao evento de webhook.';
  end if;

  /*
   * Evita repetir pagamentos, créditos e alterações
   * quando a Pagar.me reenviar o mesmo webhook.
   */
  if v_webhook_event.status = 'processed' then
    return jsonb_build_object(
      'success', true,
      'duplicate', true,
      'webhook_event_id', p_webhook_event_id
    );
  end if;

  update public.pagarme_webhook_events
  set
    status = 'processing',
    error_message = null,
    updated_at = now()
  where id = p_webhook_event_id;

  /*
   * Bloqueia a assinatura durante a renovação.
   */
  select *
  into v_subscription
  from public.subscriptions
  where external_id = p_subscription_external_id
  for update;

  if not found then
    raise exception 'Assinatura local não encontrada.';
  end if;

  /*
   * Apenas assinaturas renováveis podem receber
   * um novo ciclo.
   */
  if v_subscription.status not in (
    'active',
    'trial',
    'past_due'
  ) then
    raise exception
      'O status atual da assinatura não permite renovação.';
  end if;

  if v_subscription.cancel_at_period_end then
    raise exception
      'A assinatura está programada para cancelamento.';
  end if;

  /*
   * O contrato ativo e vigente passa a ser a fonte de
   * verdade da renovação. Não há fallback para plans.
   */
  select contract.*
  into v_active_contract
  from public.subscription_contracts as contract
  where contract.subscription_id = v_subscription.id
    and contract.status = 'active'
    and contract.billing_mode = 'recurring'
    and contract.effective_at <= p_period_start
    and (
      contract.ended_at is null
      or contract.ended_at > p_period_start
    )
  for update;

  if not found then
    raise exception
      'Contrato recorrente ativo e vigente não encontrado; reconciliação necessária.';
  end if;

  /*
   * Aplica um downgrade somente quando sua data
   * programada já tiver sido alcançada.
   */
  v_apply_downgrade :=
    v_subscription.pending_change_type = 'downgrade'
    and v_subscription.pending_plan_id is not null
    and v_subscription.pending_change_at is not null
    and v_subscription.pending_change_at <= v_effective_paid_at;

  if v_apply_downgrade then
    /*
     * Compatibilidade temporária: o downgrade ainda não
     * possui contrato pending e mantém os termos de plans.
     * A origem fica explícita em todos os registros.
     */
    select *
    into v_current_plan
    from public.plans
    where id = v_subscription.plan_id;

    if not found then
      raise exception 'Plano atual da assinatura não encontrado para o downgrade legado.';
    end if;

    select *
    into v_effective_plan
    from public.plans
    where id = v_subscription.pending_plan_id
      and is_active = true;

    if not found then
      raise exception
        'O plano agendado para downgrade não está disponível.';
    end if;

    if v_effective_plan.price >= v_current_plan.price then
      raise exception
        'A alteração pendente não corresponde a um downgrade.';
    end if;

    v_effective_plan_id := v_effective_plan.id;
    v_effective_plan_name := v_effective_plan.name;
    v_effective_price_cents := v_effective_plan.price;
    v_effective_credits := v_effective_plan.credits_included;
    v_effective_contract_id := null;
    v_effective_contract_version := null;
    v_terms_source := 'legacy_pending_downgrade_plan';
  else
    if v_subscription.plan_id is distinct from v_active_contract.plan_id then
      raise exception
        'O plano operacional diverge do contrato ativo; reconciliação necessária.';
    end if;

    v_effective_plan_id := v_active_contract.plan_id;
    v_effective_plan_name := v_active_contract.plan_name;
    v_effective_price_cents := v_active_contract.price_cents;
    v_effective_credits := v_active_contract.credits_included;
    v_effective_contract_id := v_active_contract.id;
    v_effective_contract_version := v_active_contract.version;
  end if;

  /*
   * A fatura deve corresponder aos termos efetivamente
   * renovados: contrato ativo ou downgrade legado explícito.
   */
  if p_invoice_amount <> v_effective_price_cents then
    raise exception
      'O valor da fatura não corresponde ao valor contratado para a renovação.';
  end if;

  v_effective_payment_method := coalesce(
    v_subscription.payment_method,
    p_payment_method
  );

  if v_effective_payment_method not in (
    'credit_card',
    'debit_card',
    'boleto'
  ) then
    raise exception
      'Método de pagamento inválido para a renovação.';
  end if;

  /*
   * A fatura também funciona como chave de
   * idempotência.
   */
  select
    id,
    subscription_id,
    kind
  into v_existing_payment
  from public.student_payments
  where provider = 'pagarme'
    and external_id = p_invoice_external_id
  limit 1;

  if found then
    if v_existing_payment.subscription_id
      is distinct from v_subscription.id
    then
      raise exception
        'A fatura já está vinculada a outra assinatura.';
    end if;

    if v_existing_payment.kind <> 'subscription' then
      raise exception
        'A fatura já está vinculada a um pagamento de outro tipo.';
    end if;

    update public.pagarme_webhook_events
    set
      status = 'processed',
      processed_at = now(),
      error_message = null,
      updated_at = now()
    where id = p_webhook_event_id;

    return jsonb_build_object(
      'success', true,
      'duplicate', true,
      'payment_id', v_existing_payment.id,
      'subscription_id', v_subscription.id,
      'plan_id', v_effective_plan_id,
      'contract_id', v_effective_contract_id,
      'contract_version', v_effective_contract_version,
      'terms_source', v_terms_source,
      'downgrade_contract_transition_deferred', v_apply_downgrade
    );
  end if;

  /*
   * Impede que uma nova fatura faça a assinatura voltar
   * para um período anterior ou sobreposto.
   */
  if v_subscription.current_period_start is not null
    and p_period_start <= v_subscription.current_period_start
  then
    raise exception
      'O início do novo período não é posterior ao período atual.';
  end if;

  if v_subscription.current_period_end is not null
    and p_period_end <= v_subscription.current_period_end
  then
    raise exception
      'O fim do novo período não é posterior ao período atual.';
  end if;

  if v_subscription.current_period_end is not null
    and p_period_start < v_subscription.current_period_end
  then
    raise exception
      'O período da renovação está sobreposto ao período atual.';
  end if;

  /*
   * Registra o pagamento da renovação.
   */
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
  )
  values (
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
    v_effective_paid_at,
    'pagarme-renewal:' || p_invoice_external_id,
    jsonb_build_object(
      'provider', 'pagarme',
      'source', 'pagarme_webhook',
      'webhook_event_id', p_webhook_event_id,
      'pagarme_invoice_id', p_invoice_external_id,
      'pagarme_subscription_id', p_subscription_external_id,
      'invoice_status', p_invoice_status,
      'previous_plan_id', v_subscription.plan_id,
      'effective_plan_id', v_effective_plan_id,
      'contract_id', v_effective_contract_id,
      'contract_version', v_effective_contract_version,
      'active_contract_id', v_active_contract.id,
      'active_contract_version', v_active_contract.version,
      'terms_source', v_terms_source,
      'downgrade_applied', v_apply_downgrade,
      'downgrade_contract_transition_deferred', v_apply_downgrade,
      'period_start', p_period_start,
      'period_end', p_period_end,
      'next_billing_at', p_next_billing_at
    )
  )
  returning id into v_payment_id;

  /*
   * Recupera o saldo atual dos créditos do plano.
   */
  select plan_credits
  into v_plan_balance
  from public.student_credits
  where user_id = v_subscription.user_id
  for update;

  v_plan_balance := coalesce(
    v_plan_balance,
    0
  );

  /*
   * Expira os créditos restantes do ciclo anterior
   * usando a identificação do contrato anterior.
   */
  if v_plan_balance > 0 then
    insert into public.credit_transactions (
      user_id,
      type,
      amount,
      description,
      student_payment_id,
      metadata
    )
    values (
      v_subscription.user_id,
      'plan_expiration',
      -v_plan_balance,
      format(
        'Expiração de %s crédito(s) restantes do plano %s.',
        v_plan_balance,
        v_active_contract.plan_name
      ),
      v_payment_id,
      jsonb_build_object(
        'source', 'pagarme_webhook',
        'credit_type', 'plan',
        'grant_type', 'subscription_cycle_expiration',
        'subscription_id', v_subscription.id,
        'contract_id', v_active_contract.id,
        'contract_version', v_active_contract.version,
        'plan_id', v_active_contract.plan_id,
        'plan_name', v_active_contract.plan_name,
        'terms_source', 'subscription_contract',
        'previous_period_start', v_subscription.current_period_start,
        'previous_period_end', v_subscription.current_period_end
      )
    );
  end if;

  /*
   * Libera os créditos do novo ciclo usando os termos
   * do contrato, exceto no downgrade legado explícito.
   */
  if v_effective_credits > 0 then
    insert into public.credit_transactions (
      user_id,
      type,
      amount,
      description,
      student_payment_id,
      metadata
    )
    values (
      v_subscription.user_id,
      'plan_renewal',
      v_effective_credits,
      format(
        'Liberação de %s crédito(s) pela renovação do plano %s.',
        v_effective_credits,
        v_effective_plan_name
      ),
      v_payment_id,
      jsonb_build_object(
        'source', 'pagarme_webhook',
        'credit_type', 'plan',
        'grant_type', 'subscription_renewal_cycle',
        'subscription_id', v_subscription.id,
        'contract_id', v_effective_contract_id,
        'contract_version', v_effective_contract_version,
        'active_contract_id', v_active_contract.id,
        'active_contract_version', v_active_contract.version,
        'plan_id', v_effective_plan_id,
        'plan_name', v_effective_plan_name,
        'terms_source', v_terms_source,
        'period_start', p_period_start,
        'period_end', p_period_end,
        'next_billing_at', p_next_billing_at,
        'downgrade_applied', v_apply_downgrade,
        'downgrade_contract_transition_deferred', v_apply_downgrade
      )
    );
  end if;

  /*
   * Atualiza o ciclo, a próxima cobrança e, quando
   * necessário, aplica o downgrade pendente.
   */
  update public.subscriptions
  set
    plan_id = v_effective_plan_id,
    status = 'active',

    current_period_start = p_period_start,
    current_period_end = p_period_end,
    next_billing_at = p_next_billing_at,

    pending_plan_id = case
      when v_apply_downgrade then null
      else pending_plan_id
    end,

    pending_change_type = case
      when v_apply_downgrade then null
      else pending_change_type
    end,

    pending_change_at = case
      when v_apply_downgrade then null
      else pending_change_at
    end,

    metadata =
      coalesce(metadata, '{}'::jsonb)
      ||
      jsonb_build_object(
        'last_pagarme_invoice_id', p_invoice_external_id,
        'last_renewal_payment_id', v_payment_id,
        'last_renewed_at', v_effective_paid_at,
        'previous_plan_id', v_subscription.plan_id,
        'effective_plan_id', v_effective_plan_id,
        'last_renewal_contract_id', v_effective_contract_id,
        'last_renewal_contract_version', v_effective_contract_version,
        'last_renewal_terms_source', v_terms_source,
        'downgrade_applied', v_apply_downgrade,
        'downgrade_contract_transition_deferred', v_apply_downgrade,
        'next_billing_at', p_next_billing_at
      ),

    updated_at = now()
  where id = v_subscription.id;

  update public.pagarme_webhook_events
  set
    status = 'processed',
    processed_at = now(),
    error_message = null,
    updated_at = now()
  where id = p_webhook_event_id;

  return jsonb_build_object(
    'success', true,
    'duplicate', false,
    'payment_id', v_payment_id,
    'subscription_id', v_subscription.id,
    'previous_plan_id', v_subscription.plan_id,
    'effective_plan_id', v_effective_plan_id,
    'contract_id', v_effective_contract_id,
    'contract_version', v_effective_contract_version,
    'active_contract_id', v_active_contract.id,
    'active_contract_version', v_active_contract.version,
    'terms_source', v_terms_source,
    'downgrade_applied', v_apply_downgrade,
    'downgrade_contract_transition_deferred', v_apply_downgrade,
    'expired_credits', v_plan_balance,
    'granted_credits', v_effective_credits,
    'period_start', p_period_start,
    'period_end', p_period_end,
    'next_billing_at', p_next_billing_at
  );

exception
  when others then
    update public.pagarme_webhook_events
    set
      status = 'failed',
      error_message = sqlerrm,
      updated_at = now()
    where id = p_webhook_event_id;

    return jsonb_build_object(
      'success', false,
      'message', sqlerrm,
      'webhook_event_id', p_webhook_event_id
    );
end;
$$;

commit;
