begin;

create table public.subscription_support_operations (
  id uuid primary key,
  student_id uuid not null references public.profiles(id),
  actor_id uuid not null references public.profiles(id),
  subscription_id uuid not null references public.subscriptions(id),
  payment_id uuid not null references public.student_payments(id),
  history_id uuid references public.subscription_cancellation_history(id),
  provider_subscription_id text not null,
  provider_charge_id text not null,
  action text not null check (action in ('cancel_only','cancel_refund','refund_courtesy','refund_only')),
  amount integer not null check (amount >= 0),
  baseline_refunded integer not null check (baseline_refunded >= 0),
  reason text not null check (length(trim(reason)) between 10 and 1000),
  courtesy_credits integer check (courtesy_credits >= 0),
  courtesy_until timestamptz,
  held_credits integer not null default 0,
  status text not null default 'pending' check (status in ('pending','refund_processing','completed','operational_issue')),
  provider_canceled boolean not null default false,
  refund_confirmed boolean not null default false,
  snapshot jsonb not null,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  dispatched_at timestamptz
);
-- A timeout does not release this reservation: another refund would be unsafe.
create unique index support_open_student_idx on public.subscription_support_operations(student_id)
  where status <> 'completed';
create unique index support_open_charge_idx on public.subscription_support_operations(provider_charge_id)
  where status <> 'completed';
alter table public.subscription_support_operations enable row level security;
revoke all on public.subscription_support_operations from anon, authenticated;
grant select on public.subscription_support_operations to authenticated;
grant select, insert, update on public.subscription_support_operations to service_role;
create policy support_admin_select on public.subscription_support_operations for select to authenticated
  using (public.get_my_role() = 'ADMIN');

alter table public.subscription_cancellation_history drop constraint subscription_cancellation_history_kind_check;
alter table public.subscription_cancellation_history add constraint subscription_cancellation_history_kind_check
  check (kind in ('withdrawal','ordinary','support'));

create function public.prepare_subscription_support_operation(
  p_id uuid, p_student_id uuid, p_payment_id uuid, p_action text, p_amount integer,
  p_reason text, p_charge_id text, p_baseline_refunded integer,
  p_courtesy_credits integer default null, p_courtesy_until timestamptz default null
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_sub public.subscriptions%rowtype;
  v_payment public.student_payments%rowtype;
  v_op public.subscription_support_operations%rowtype;
  v_snapshot jsonb; v_available integer; v_hold integer := 0; v_history uuid;
  v_now timestamptz := now(); v_effective timestamptz; v_actor_name text;
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
    or v_sub.current_period_end is null or v_sub.current_period_end <= v_now or v_sub.external_id is null or v_sub.external_id !~ '^sub_[A-Za-z0-9]+$'
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
      or p_courtesy_until is null or p_courtesy_until <= v_now or p_courtesy_until > v_sub.current_period_end)
    then raise exception 'Cortesia deve usar créditos existentes e terminar até o fim do período pago.'; end if;
  select full_name into v_actor_name from public.profiles where id = auth.uid();
  v_snapshot := v_snapshot || jsonb_build_object('support_action', p_action,
    'administrator_id', auth.uid(), 'administrator_name', v_actor_name, 'refund_amount', p_amount,
    'credits_available', v_available, 'courtesy_credits', p_courtesy_credits, 'courtesy_until', p_courtesy_until);
  v_effective := case p_action when 'cancel_only' then v_sub.current_period_end
    when 'refund_courtesy' then p_courtesy_until when 'cancel_refund' then v_now else null end;
  if p_action <> 'refund_only' then
    update public.subscriptions set cancel_at_period_end = true, cancellation_mode = 'end_of_period',
      cancellation_requested_at = v_now, cancellation_effective_at = v_effective,
      cancellation_provider_status = 'pending', cancellation_reason = 'support',
      cancellation_metadata = jsonb_build_object('source','admin_support','requested_by_user_id',auth.uid(),
        'details',trim(p_reason),'support_operation_id',p_id), updated_at = v_now where id = v_sub.id;
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

create function public.advance_subscription_support_operation(
  p_id uuid, p_provider_canceled boolean default false, p_refunded_total integer default null,
  p_failure boolean default false
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_op public.subscription_support_operations%rowtype; v_done boolean; v_status text; v_label text;
begin
  if coalesce(auth.jwt() ->> 'role','') <> 'service_role' then raise exception 'Acesso não autorizado.'; end if;
  select * into v_op from public.subscription_support_operations where id = p_id for update;
  if not found then raise exception 'Atendimento não encontrado.'; end if;
  if v_op.status = 'completed' then return to_jsonb(v_op); end if;
  -- Cumulative provider amount must cover baseline + this operation (partial included).
  v_op.provider_canceled := v_op.provider_canceled or p_provider_canceled;
  v_op.refund_confirmed := v_op.refund_confirmed or
    (p_refunded_total is not null and p_refunded_total >= v_op.baseline_refunded + v_op.amount and v_op.amount > 0);
  v_done := (v_op.action = 'refund_only' or v_op.provider_canceled)
    and (v_op.amount = 0 or v_op.refund_confirmed);
  v_status := case when v_done then 'completed' when p_failure then 'operational_issue' else 'refund_processing' end;
  update public.subscription_support_operations set provider_canceled = v_op.provider_canceled,
    refund_confirmed = v_op.refund_confirmed,status = v_status,updated_at = now(),
    completed_at = case when v_done then now() else null end where id = p_id;
  if v_op.provider_canceled and v_op.action <> 'refund_only' then
    update public.subscriptions set cancellation_provider_status = 'canceled', provider_canceled_at = coalesce(provider_canceled_at,now()),
      updated_at = now() where id = v_op.subscription_id and external_id = v_op.provider_subscription_id;
  end if;
  if v_done then
    if v_op.action in ('cancel_refund','refund_courtesy') then
      update public.subscription_credit_allocations set status = 'skipped',
        metadata = coalesce(metadata,'{}'::jsonb) || jsonb_build_object('skipped_reason','support_refund',
          'support_operation_id',p_id),updated_at = now()
        where subscription_id = v_op.subscription_id and status = 'scheduled';
    end if;
    if v_op.action = 'cancel_refund' then
      update public.subscriptions set status = 'canceled', cancel_at_period_end = true,
        canceled_at = now(), current_period_end = now(),updated_at = now()
        where id = v_op.subscription_id and external_id = v_op.provider_subscription_id;
    elsif v_op.action = 'refund_courtesy' then
      update public.subscriptions set current_period_end = v_op.courtesy_until, cancellation_effective_at = v_op.courtesy_until,
        updated_at = now() where id = v_op.subscription_id and external_id = v_op.provider_subscription_id;
    end if;
    v_label := case v_op.action when 'cancel_only' then 'Renovação interrompida pelo suporte'
      when 'cancel_refund' then 'Cancelamento e reembolso confirmados pelo suporte'
      when 'refund_courtesy' then 'Reembolso confirmado com acesso de cortesia'
      else 'Reembolso confirmado sem cancelar a assinatura' end;
    insert into public.credit_transactions(user_id,type,amount,description,metadata)
      values(v_op.student_id,'administrative_adjustment',0,v_label,jsonb_build_object('source','admin_support',
        'support_operation_id',p_id,'support_action',v_op.action,'reason',v_op.reason,
        'refund_amount',v_op.amount,'administrator_id',v_op.actor_id,'credit_type','plan'));
  else
    v_label := case when p_failure then 'Falha operacional no atendimento: confirmação necessária'
      else 'Aguardando confirmação do reembolso do atendimento' end;
  end if;
  update public.subscription_cancellation_history set
    status = case when v_done and v_op.action = 'cancel_only' then 'scheduled'
      when v_done then 'refunded' else v_status end,
    refund_started_at = case when v_op.amount > 0 then coalesce(refund_started_at,v_op.created_at) else null end,
    refund_completed_at = case when v_op.refund_confirmed then coalesce(refund_completed_at,now()) else null end,
    last_activity_at = now(),events = events || jsonb_build_array(jsonb_build_object('label',v_label,'at',now()))
    where id = v_op.history_id and (status is distinct from
      case when v_done and v_op.action = 'cancel_only' then 'scheduled' when v_done then 'refunded' else v_status end
      or v_done);
  select * into v_op from public.subscription_support_operations where id = p_id;
  return to_jsonb(v_op);
end;
$$;
revoke all on function public.advance_subscription_support_operation(uuid,boolean,integer,boolean) from public,anon,authenticated;
grant execute on function public.advance_subscription_support_operation(uuid,boolean,integer,boolean) to service_role;

-- Do not let a second self-service withdrawal overlap an unfinished support refund.
create function public.guard_support_withdrawal_overlap() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  perform pg_advisory_xact_lock(hashtextextended(new.student_id::text, 0));
  if exists(select 1 from public.subscription_support_operations where student_id = new.student_id and status <> 'completed')
    then raise exception 'Existe um atendimento em processamento. Aguarde a confirmação.'; end if;
  return new;
end; $$;
revoke all on function public.guard_support_withdrawal_overlap() from public,anon,authenticated;
create trigger guard_support_withdrawal_overlap before insert on public.subscription_withdrawal_requests
  for each row execute function public.guard_support_withdrawal_overlap();

create function public.preview_subscription_support_snapshot(p_student_id uuid,p_payment_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_sub public.subscriptions%rowtype; v_snapshot jsonb;
begin
  if auth.uid() is null or public.get_my_role() is distinct from 'ADMIN' then raise exception 'Acesso não autorizado.'; end if;
  select * into v_sub from public.subscriptions where user_id = p_student_id;
  if not found then raise exception 'Assinatura não encontrada.'; end if;
  v_snapshot := public.capture_cancellation_snapshot(v_sub.id,v_sub.external_id,now(),p_payment_id);
  if exists (select 1 from public.credit_transactions where user_id = p_student_id
    and type::text = 'essay_usage' and created_at >= (v_snapshot ->> 'paid_at')::timestamptz
    and coalesce(metadata ->> 'credit_type','plan') = 'plan'
    and metadata ->> 'provider_subscription_id' is null and metadata ->> 'subscription_id' is null)
    then v_snapshot := v_snapshot || jsonb_build_object('credits_used',null); end if;
  return v_snapshot;
end; $$;
revoke all on function public.preview_subscription_support_snapshot(uuid,uuid) from public,anon;
grant execute on function public.preview_subscription_support_snapshot(uuid,uuid) to authenticated;

create function public.guard_support_credit_refund() returns trigger language plpgsql security definer set search_path = '' as $$
declare v_op public.subscription_support_operations%rowtype; v_provider text; v_local_subscription text; v_usage_at timestamptz;
begin
  if new.type::text <> 'essay_refund' or coalesce(new.metadata ->> 'credit_type','plan') <> 'plan'
    or coalesce(new.metadata ->> 'plan_source','') = 'mentorship' then return new; end if;
  select metadata ->> 'provider_subscription_id',metadata ->> 'subscription_id',created_at
    into v_provider,v_local_subscription,v_usage_at from public.credit_transactions
    where user_id = new.user_id and type::text = 'essay_usage' and metadata ->> 'essay_id' = new.metadata ->> 'essay_id'
    order by created_at desc limit 1;
  select * into v_op from public.subscription_support_operations
    where student_id = new.user_id and action in ('cancel_refund','refund_courtesy')
      and (provider_subscription_id = v_provider or (v_provider is null
        and subscription_id::text = v_local_subscription and v_usage_at >= (snapshot ->> 'paid_at')::timestamptz))
      and created_at >= v_usage_at
    order by created_at desc limit 1;
  if found then
    new.type := 'administrative_adjustment'; new.amount := 0;
    new.description := 'Crédito não devolvido após cancelamento com reembolso';
    new.metadata := coalesce(new.metadata,'{}'::jsonb) || jsonb_build_object('source','admin_support',
      'support_operation_id',v_op.id,'reason',v_op.reason);
  end if;
  return new;
end; $$;
revoke all on function public.guard_support_credit_refund() from public,anon,authenticated;
create trigger guard_support_credit_refund before insert on public.credit_transactions
  for each row execute function public.guard_support_credit_refund();

create function public.guard_support_subscription_change() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  -- Provider cancellation acknowledgements can still update their status/date.
  -- A checkout, reactivation or second cancellation may not replace the contract
  -- while a financial outcome is uncertain.
  if exists (select 1 from public.subscription_support_operations where subscription_id = old.id and status <> 'completed')
    and (new.external_id is distinct from old.external_id or new.plan_id is distinct from old.plan_id
      or new.cancel_at_period_end is distinct from old.cancel_at_period_end
      or new.cancellation_requested_at is distinct from old.cancellation_requested_at
      or new.cancellation_mode is distinct from old.cancellation_mode
      or new.pending_plan_id is distinct from old.pending_plan_id)
    then raise exception 'Existe um atendimento de suporte em processamento. Aguarde a confirmação.'; end if;
  return new;
end; $$;
revoke all on function public.guard_support_subscription_change() from public,anon,authenticated;
create trigger guard_support_subscription_change before update on public.subscriptions
  for each row execute function public.guard_support_subscription_change();

-- Keep financial support outcomes intact when later subscription updates arrive.
-- The ordinary recorder must not turn a confirmed support refund into "scheduled".
create or replace function public.record_ordinary_cancellation_history()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_status text; v_event_at timestamptz; v_support public.subscription_support_operations%rowtype;
begin
  if old.cancellation_metadata ->> 'source' = 'admin_support'
    and new.cancel_at_period_end and old.cancel_at_period_end
    and new.external_id = old.external_id
    and new.cancellation_requested_at = old.cancellation_requested_at then
    select * into v_support from public.subscription_support_operations
      where id::text = old.cancellation_metadata ->> 'support_operation_id';
    if found then
      update public.subscription_cancellation_history set
        effective_at = new.cancellation_effective_at,
        provider_canceled_at = new.provider_canceled_at,
        status = case when v_support.status = 'completed' and v_support.action = 'cancel_only'
          then case when new.status = 'canceled' then 'canceled' else 'scheduled' end else status end,
        last_activity_at = case when new.status = 'canceled' and old.status is distinct from 'canceled'
          then now() else last_activity_at end,
        events = events || case when new.status = 'canceled' and old.status is distinct from 'canceled'
          then jsonb_build_array(jsonb_build_object('label','Acesso encerrado','at',now())) else '[]'::jsonb end
        where id = v_support.history_id;
      return new;
    end if;
  end if;
  if old.cancellation_mode = 'end_of_period' and old.cancel_at_period_end
    and new.cancellation_mode = 'end_of_period' and new.cancel_at_period_end
    and new.external_id = old.external_id and old.cancellation_requested_at is not null then
    new.cancellation_requested_at := old.cancellation_requested_at;
  end if;
  if new.cancellation_mode = 'end_of_period' and new.cancellation_requested_at is not null then
    v_status := case when new.status = 'canceled' then 'canceled'
      when new.cancellation_provider_status = 'pending' then 'provider_pending' else 'scheduled' end;
    v_event_at := greatest(new.cancellation_requested_at,
      coalesce(new.provider_canceled_at,new.cancellation_requested_at),
      coalesce(new.canceled_at,new.cancellation_requested_at));
    insert into public.subscription_cancellation_history(student_id,subscription_id,provider_subscription_id,kind,
      requested_at,last_activity_at,status,effective_at,provider_canceled_at,cancellation_reason,cancellation_details,snapshot,events)
      values(new.user_id,new.id,new.external_id,'ordinary',new.cancellation_requested_at,v_event_at,v_status,
        new.cancellation_effective_at,new.provider_canceled_at,new.cancellation_reason,new.cancellation_metadata ->> 'details',
        public.capture_cancellation_snapshot(new.id,new.external_id,new.cancellation_requested_at),
        jsonb_build_array(jsonb_build_object('label','Cancelamento solicitado','at',new.cancellation_requested_at)))
      on conflict(subscription_id,provider_subscription_id,requested_at) do update set
        status = excluded.status,effective_at = excluded.effective_at,provider_canceled_at = excluded.provider_canceled_at,
        last_activity_at = greatest(subscription_cancellation_history.last_activity_at,excluded.last_activity_at),
        events = subscription_cancellation_history.events || case
          when subscription_cancellation_history.status is distinct from excluded.status then
            jsonb_build_array(jsonb_build_object('label',case excluded.status when 'canceled' then 'Acesso encerrado'
              when 'scheduled' then 'Renovação interrompida' else 'Confirmação do provedor pendente' end,'at',v_event_at))
          else '[]'::jsonb end;
  elsif old.cancellation_mode = 'end_of_period' and old.cancellation_requested_at is not null and not new.cancel_at_period_end then
    update public.subscription_cancellation_history set status = 'undone',last_activity_at = now(),
      events = events || jsonb_build_array(jsonb_build_object('label','Cancelamento desfeito','at',now()))
      where subscription_id = old.id and provider_subscription_id = old.external_id and requested_at = old.cancellation_requested_at;
  end if;
  return new;
end; $$;

commit;
