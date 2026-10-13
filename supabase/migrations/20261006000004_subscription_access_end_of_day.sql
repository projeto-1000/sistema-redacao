-- Access policy only: financial amounts, dispatch, authorization and refund timing are unchanged.
-- Do not backfill historical cancellations or change provider/next-billing timestamps.
create function public.subscription_access_end(p_end timestamptz)
returns timestamptz language sql immutable strict set search_path = '' as $$
  select (((p_end at time zone 'America/Sao_Paulo')::date + time '23:59:59.999')
    at time zone 'America/Sao_Paulo');
$$;
revoke all on function public.subscription_access_end(timestamptz) from public,anon;
grant execute on function public.subscription_access_end(timestamptz) to authenticated,service_role;

create or replace function public.prepare_subscription_support_operation(
  p_id uuid, p_student_id uuid, p_payment_id uuid, p_action text, p_amount integer,
  p_reason text, p_charge_id text, p_baseline_refunded integer,
  p_courtesy_credits integer default null, p_courtesy_until timestamptz default null
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_sub public.subscriptions%rowtype;
  v_payment public.student_payments%rowtype;
  v_op public.subscription_support_operations%rowtype;
  v_snapshot jsonb; v_available integer; v_hold integer := 0; v_history uuid;
  v_now timestamptz := now(); v_effective timestamptz; v_actor_name text; v_access_end timestamptz;
begin
  if auth.uid() is null or public.get_my_role() is distinct from 'ADMIN' then raise exception 'Acesso não autorizado.'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_student_id::text, 0));
  select * into v_op from public.subscription_support_operations where id = p_id;
  if found then
    if v_op.actor_id <> auth.uid() or v_op.student_id <> p_student_id or v_op.payment_id <> p_payment_id
      or v_op.action <> p_action or v_op.amount <> p_amount or v_op.reason <> trim(p_reason)
      or v_op.courtesy_credits is distinct from p_courtesy_credits
      or v_op.courtesy_until is distinct from p_courtesy_until then raise exception 'Operação já utilizada.'; end if;
    return to_jsonb(v_op);
  end if;
  select * into v_sub from public.subscriptions where user_id = p_student_id for update;
  if not found or v_sub.status <> 'active' or v_sub.cancel_at_period_end
    or v_sub.pending_plan_id is not null or v_sub.withdrawal_status in ('under_review','refund_processing','operational_issue')
    or v_sub.current_period_end is null or public.subscription_access_end(v_sub.current_period_end) <= v_now or v_sub.external_id is null or v_sub.external_id !~ '^sub_[A-Za-z0-9]+$'
    then raise exception 'A assinatura não está disponível para atendimento.'; end if;
  select * into v_payment from public.student_payments
    where id = p_payment_id and user_id = p_student_id and subscription_id = v_sub.id
      and provider = 'pagarme' and kind = 'subscription' and status in ('paid','active') for update;
  if not found or v_payment.paid_at is null or
    coalesce(v_payment.metadata ->> 'pagarme_subscription_id', v_payment.external_id) is distinct from v_sub.external_id
    then raise exception 'Pagamento não pertence à contratação atual.'; end if;
  -- Credits are a current-cycle balance, never use an older charge to erase them.
  if exists (select 1 from public.student_payments where user_id = p_student_id and subscription_id = v_sub.id
    and kind = 'subscription' and status in ('paid','active') and paid_at > v_payment.paid_at)
    then raise exception 'Selecione a cobrança do ciclo atual.'; end if;
  if p_action not in ('cancel_only','cancel_refund','refund_courtesy','refund_only')
    or p_amount < 0 or p_baseline_refunded < 0 or p_amount + p_baseline_refunded > v_payment.amount
    or (p_action = 'cancel_only') <> (p_amount = 0) or length(trim(p_reason)) not between 10 and 1000
    or p_charge_id !~ '^ch_[A-Za-z0-9]+$'
    then raise exception 'Dados de atendimento inválidos.'; end if;
  select plan_credits into v_available from public.student_credits where user_id = p_student_id for update;
  if not found then raise exception 'Saldo de créditos não encontrado.'; end if;
  v_snapshot := public.capture_cancellation_snapshot(v_sub.id, v_sub.external_id, v_now, p_payment_id);
  if exists (select 1 from public.credit_transactions where user_id = p_student_id
    and type::text = 'essay_usage' and created_at between v_payment.paid_at and v_now
    and coalesce(metadata ->> 'credit_type','plan') = 'plan'
    and metadata ->> 'provider_subscription_id' is null and metadata ->> 'subscription_id' is null)
    then v_snapshot := v_snapshot || jsonb_build_object('credits_used',null); end if;
  if p_action in ('cancel_refund','refund_courtesy') and
    ((v_snapshot ->> 'credits_granted') is null or (v_snapshot ->> 'credits_used') is null
      or v_available > greatest((v_snapshot ->> 'credits_granted')::integer - (v_snapshot ->> 'credits_used')::integer, 0))
    then raise exception 'Não foi possível atribuir os créditos com segurança. Nenhuma alteração foi realizada.'; end if;
  if p_action = 'refund_courtesy' and
    (p_courtesy_credits is null or p_courtesy_credits < 0 or p_courtesy_credits > v_available
      or p_courtesy_until is null or p_courtesy_until <= v_now or p_courtesy_until > public.subscription_access_end(v_sub.current_period_end))
    then raise exception 'Cortesia deve usar créditos existentes e terminar até o fim do período pago.'; end if;
  select full_name into v_actor_name from public.profiles where id = auth.uid();
  v_snapshot := v_snapshot || jsonb_build_object('support_action', p_action,
    'administrator_id', auth.uid(), 'administrator_name', v_actor_name, 'refund_amount', p_amount,
    'credits_available', v_available, 'courtesy_credits', p_courtesy_credits, 'courtesy_until', p_courtesy_until);
  v_access_end := public.subscription_access_end(v_sub.current_period_end);
  v_effective := case p_action when 'cancel_only' then v_access_end
    when 'refund_courtesy' then p_courtesy_until when 'cancel_refund' then v_now else null end;
  if p_action <> 'refund_only' then
    update public.subscriptions set cancel_at_period_end = true, cancellation_mode = 'end_of_period',
      cancellation_requested_at = v_now, cancellation_effective_at = v_effective,
      current_period_end = case when p_action = 'cancel_only' then v_access_end else current_period_end end,
      cancellation_provider_status = 'pending', cancellation_reason = 'support',
      cancellation_metadata = jsonb_build_object('source','admin_support','requested_by_user_id',auth.uid(),
        'details',trim(p_reason),'support_operation_id',p_id,'original_period_end',v_sub.current_period_end), updated_at = v_now where id = v_sub.id;
    select id into v_history from public.subscription_cancellation_history
      where subscription_id = v_sub.id and provider_subscription_id = v_sub.external_id and requested_at = v_now;
    update public.subscription_cancellation_history set kind = 'support', snapshot = v_snapshot,
      cancellation_details = trim(p_reason) where id = v_history;
  else
    insert into public.subscription_cancellation_history(student_id,subscription_id,provider_subscription_id,
      kind,requested_at,last_activity_at,status,cancellation_reason,cancellation_details,snapshot,events)
      values(p_student_id,v_sub.id,v_sub.external_id,'support',v_now,v_now,'refund_processing','support',trim(p_reason),v_snapshot,
        jsonb_build_array(jsonb_build_object('label','Reembolso sem cancelamento solicitado pelo suporte','at',v_now))) returning id into v_history;
  end if;
  v_hold := case p_action when 'cancel_refund' then v_available
    when 'refund_courtesy' then v_available - p_courtesy_credits else 0 end;
  -- The existing ledger trigger recalculates balances from this hold entry.
  insert into public.subscription_support_operations(id,student_id,actor_id,subscription_id,payment_id,history_id,
    provider_subscription_id,provider_charge_id,action,amount,baseline_refunded,reason,courtesy_credits,courtesy_until,held_credits,snapshot)
    values(p_id,p_student_id,auth.uid(),v_sub.id,p_payment_id,v_history,v_sub.external_id,p_charge_id,p_action,p_amount,
      p_baseline_refunded,trim(p_reason),p_courtesy_credits,p_courtesy_until,v_hold,v_snapshot) returning * into v_op;
  if p_action in ('cancel_refund','refund_courtesy') then
    update public.subscription_credit_allocations set status = 'skipped',
      metadata = coalesce(metadata,'{}'::jsonb) || jsonb_build_object('support_operation_id',p_id,
        'support_original_available_at',available_at,'support_original_status',status,
        'skipped_reason','support_refund'),updated_at = v_now
      where subscription_id = v_sub.id and status = 'scheduled';
  end if;
  insert into public.credit_transactions(user_id,type,amount,description,metadata)
    values(p_student_id,'administrative_adjustment',-v_hold,'Atendimento de cancelamento ou reembolso iniciado',
      jsonb_build_object('source','admin_support','support_operation_id',p_id,'support_action',p_action,
        'reason',trim(p_reason),'administrator_id',auth.uid(),'credit_type','plan'));
  return to_jsonb(v_op);
end;
$$;
revoke all on function public.prepare_subscription_support_operation(uuid,uuid,uuid,text,integer,text,text,integer,integer,timestamptz) from public,anon;
grant execute on function public.prepare_subscription_support_operation(uuid,uuid,uuid,text,integer,text,text,integer,integer,timestamptz) to authenticated;
