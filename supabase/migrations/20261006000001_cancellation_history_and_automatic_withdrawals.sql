begin;

create function public.get_subscription_cancellation_policy_version()
returns integer language sql stable set search_path = '' as $$ select 2; $$;
revoke all on function public.get_subscription_cancellation_policy_version() from public, anon;
grant execute on function public.get_subscription_cancellation_policy_version() to authenticated;

-- Append-only request identity; snapshots never follow later profile/plan changes.
create table public.subscription_cancellation_history (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id),
  subscription_id uuid not null references public.subscriptions(id),
  withdrawal_request_id uuid unique references public.subscription_withdrawal_requests(id),
  provider_subscription_id text not null,
  kind text not null check (kind in ('withdrawal', 'ordinary')),
  requested_at timestamptz not null,
  last_activity_at timestamptz not null,
  status text not null,
  effective_at timestamptz,
  provider_canceled_at timestamptz,
  refund_started_at timestamptz,
  refund_completed_at timestamptz,
  cancellation_reason text,
  cancellation_details text,
  snapshot jsonb not null,
  events jsonb not null default '[]'::jsonb,
  unique (subscription_id, provider_subscription_id, requested_at)
);
create index cancellation_history_student_activity_idx
  on public.subscription_cancellation_history(student_id, last_activity_at desc);
alter table public.subscription_cancellation_history enable row level security;
revoke all on public.subscription_cancellation_history from anon, authenticated;
grant select on public.subscription_cancellation_history to authenticated;
grant select, insert, update on public.subscription_cancellation_history to service_role;
create policy cancellation_history_admin_select
  on public.subscription_cancellation_history for select to authenticated
  using (public.get_my_role() = 'ADMIN');

create function public.capture_cancellation_snapshot(
  p_subscription_id uuid, p_provider_id text, p_requested_at timestamptz,
  p_payment_id uuid default null, p_historical boolean default false
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_subscription public.subscriptions%rowtype;
  v_payment public.student_payments%rowtype;
  v_profile public.profiles%rowtype;
  v_plan public.plans%rowtype;
  v_granted integer;
  v_used integer;
begin
  select * into v_subscription from public.subscriptions where id = p_subscription_id;
  select * into v_profile from public.profiles where id = v_subscription.user_id;
  select * into v_payment from public.student_payments payment
  where payment.user_id = v_subscription.user_id
    and payment.subscription_id = p_subscription_id
    and payment.paid_at <= p_requested_at
    and ((p_payment_id is not null and payment.id = p_payment_id)
      or (p_payment_id is null and payment.kind = 'subscription'
        and (payment.external_id = p_provider_id
          or payment.metadata ->> 'pagarme_subscription_id' = p_provider_id)))
  order by payment.paid_at desc, payment.id limit 1;
  select * into v_plan from public.plans
    where id = coalesce(v_payment.plan_id, v_subscription.plan_id);
  -- Legacy mutable plan/profile data is explicitly marked as reconstructed.
  if not p_historical and v_payment.paid_at is not null then
    select
      (sum(transaction.amount) filter (
        where transaction.amount > 0 and transaction.type::text in
          ('new_subscription', 'subscription_reactivation', 'plan_change', 'plan_renewal')
      ))::integer,
      coalesce(sum(-transaction.amount) filter (
        where transaction.type::text = 'essay_usage' and transaction.amount < 0
      ), 0)::integer
    into v_granted, v_used
    from public.credit_transactions transaction
    where transaction.user_id = v_subscription.user_id
      and transaction.created_at >= v_payment.paid_at
      and transaction.created_at <= p_requested_at
      and coalesce(transaction.metadata ->> 'credit_type', 'plan') = 'plan'
      and (transaction.metadata ->> 'provider_subscription_id' = p_provider_id
        or (transaction.metadata ->> 'provider_subscription_id' is null
          and transaction.metadata ->> 'subscription_id' = p_subscription_id::text));
    -- No attributable grant ledger means unknown, not an invented entitlement.
    if v_granted is null then v_used := null; end if;
  end if;
  return jsonb_build_object(
    'student_name', v_profile.full_name, 'student_email', v_profile.email,
    'plan_name', v_plan.name, 'plan_id', v_plan.id,
    'payment_id', v_payment.id, 'amount', v_payment.amount,
    'paid_at', v_payment.paid_at, 'credits_granted', v_granted,
    'credits_used', v_used, 'historical_reconstruction', p_historical
  );
end;
$$;
revoke all on function public.capture_cancellation_snapshot(uuid,text,timestamptz,uuid,boolean)
  from public, anon, authenticated;

create function public.record_withdrawal_history()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    insert into public.subscription_cancellation_history (
      student_id, subscription_id, withdrawal_request_id, provider_subscription_id,
      kind, requested_at, last_activity_at, status, cancellation_reason,
      cancellation_details, snapshot, events
    ) values (
      new.student_id, new.subscription_id, new.id, new.provider_subscription_id,
      'withdrawal', new.requested_at, new.requested_at, new.status,
      new.cancellation_reason, new.cancellation_details,
      public.capture_cancellation_snapshot(new.subscription_id,
        new.provider_subscription_id, new.requested_at, new.initial_payment_id),
      jsonb_build_array(jsonb_build_object('label', 'Cancelamento solicitado', 'at', new.requested_at))
    );
  else
    if new.status is not distinct from old.status
      and new.refund_started_at is not distinct from old.refund_started_at
      and new.refund_completed_at is not distinct from old.refund_completed_at
      and new.failure_at is not distinct from old.failure_at then
      return new;
    end if;
    update public.subscription_cancellation_history set
      status = new.status,
      refund_started_at = new.refund_started_at,
      refund_completed_at = new.refund_completed_at,
      last_activity_at = greatest(last_activity_at, new.updated_at),
      events = events || case
        when new.status is distinct from old.status
          or new.refund_started_at is distinct from old.refund_started_at
          or new.refund_completed_at is distinct from old.refund_completed_at
          or new.failure_at is distinct from old.failure_at
        then jsonb_build_array(jsonb_build_object(
          'label', case
            when new.status = 'refunded' then 'Reembolso confirmado'
            when new.status = 'operational_issue' then 'Falha operacional registrada'
            when new.status = 'rejected' then 'Decisão administrativa anterior registrada'
            when new.refund_started_at is distinct from old.refund_started_at then 'Reembolso iniciado'
            else 'Processamento do reembolso atualizado' end,
          'at', coalesce(new.refund_completed_at, new.updated_at)))
        else '[]'::jsonb end
    where withdrawal_request_id = new.id;
  end if;
  return new;
end;
$$;
revoke all on function public.record_withdrawal_history() from public, anon, authenticated;
create trigger record_withdrawal_history after insert or update
  on public.subscription_withdrawal_requests
  for each row execute function public.record_withdrawal_history();

create function public.record_ordinary_cancellation_history()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_status text; v_event_at timestamptz;
begin
  -- Concurrent clicks/retries on the same scheduled cancellation must retain
  -- its original request identity, not create a second historical request.
  if old.cancellation_mode = 'end_of_period' and old.cancel_at_period_end
    and new.cancellation_mode = 'end_of_period' and new.cancel_at_period_end
    and new.external_id = old.external_id
    and old.cancellation_requested_at is not null then
    new.cancellation_requested_at := old.cancellation_requested_at;
  end if;
  if new.cancellation_mode = 'end_of_period' and new.cancellation_requested_at is not null then
    v_status := case when new.status = 'canceled' then 'canceled'
      when new.cancellation_provider_status = 'pending' then 'provider_pending'
      else 'scheduled' end;
    v_event_at := greatest(new.cancellation_requested_at,
      coalesce(new.provider_canceled_at, new.cancellation_requested_at),
      coalesce(new.canceled_at, new.cancellation_requested_at));
    insert into public.subscription_cancellation_history (
      student_id, subscription_id, provider_subscription_id, kind,
      requested_at, last_activity_at, status, effective_at, provider_canceled_at,
      cancellation_reason, cancellation_details, snapshot, events
    ) values (
      new.user_id, new.id, new.external_id, 'ordinary',
      new.cancellation_requested_at, v_event_at, v_status,
      new.cancellation_effective_at, new.provider_canceled_at,
      new.cancellation_reason, new.cancellation_metadata ->> 'details',
      public.capture_cancellation_snapshot(new.id, new.external_id, new.cancellation_requested_at),
      jsonb_build_array(jsonb_build_object('label', 'Cancelamento solicitado', 'at', new.cancellation_requested_at))
    ) on conflict (subscription_id, provider_subscription_id, requested_at) do update set
      status = excluded.status, effective_at = excluded.effective_at,
      provider_canceled_at = excluded.provider_canceled_at,
      last_activity_at = greatest(subscription_cancellation_history.last_activity_at, excluded.last_activity_at),
      events = subscription_cancellation_history.events || case
        when subscription_cancellation_history.status is distinct from excluded.status
        then jsonb_build_array(jsonb_build_object('label', case excluded.status
          when 'canceled' then 'Acesso encerrado'
          when 'scheduled' then 'Renovação interrompida'
          else 'Confirmação do provedor pendente' end, 'at', v_event_at))
        else '[]'::jsonb end;
  elsif old.cancellation_mode = 'end_of_period'
    and old.cancellation_requested_at is not null and not new.cancel_at_period_end then
    update public.subscription_cancellation_history set
      status = 'undone', last_activity_at = now(),
      events = events || jsonb_build_array(jsonb_build_object('label', 'Cancelamento desfeito', 'at', now()))
    where subscription_id = old.id and provider_subscription_id = old.external_id
      and requested_at = old.cancellation_requested_at;
  end if;
  return new;
end;
$$;
revoke all on function public.record_ordinary_cancellation_history() from public, anon, authenticated;
create trigger record_ordinary_cancellation_history before update on public.subscriptions
  for each row execute function public.record_ordinary_cancellation_history();

-- Backfill preserves past decisions; never initiates remote refunds or guesses usage.
insert into public.subscription_cancellation_history (
  student_id, subscription_id, withdrawal_request_id, provider_subscription_id,
  kind, requested_at, last_activity_at, status, refund_started_at, refund_completed_at,
  cancellation_reason, cancellation_details, snapshot, events
)
select student_id, subscription_id, id, provider_subscription_id, 'withdrawal',
  requested_at, greatest(requested_at, reviewed_at, failure_at, refund_started_at, refund_completed_at), status, refund_started_at,
  refund_completed_at, cancellation_reason, cancellation_details,
  public.capture_cancellation_snapshot(subscription_id, provider_subscription_id,
    requested_at, initial_payment_id, true),
  jsonb_build_array(jsonb_build_object('label', 'Cancelamento solicitado', 'at', requested_at))
    || case when reviewed_at is not null then jsonb_build_array(jsonb_build_object(
      'label', 'Decisão administrativa anterior', 'at', reviewed_at, 'detail', review_reason)) else '[]'::jsonb end
    || case when refund_started_at is not null then jsonb_build_array(jsonb_build_object(
      'label', 'Reembolso iniciado', 'at', refund_started_at)) else '[]'::jsonb end
    || case when refund_completed_at is not null then jsonb_build_array(jsonb_build_object(
      'label', 'Reembolso confirmado', 'at', refund_completed_at)) else '[]'::jsonb end
from public.subscription_withdrawal_requests;

insert into public.subscription_cancellation_history (
  student_id, subscription_id, provider_subscription_id, kind, requested_at,
  last_activity_at, status, effective_at, provider_canceled_at,
  cancellation_reason, cancellation_details, snapshot, events
)
select user_id, id, external_id, 'ordinary', cancellation_requested_at,
  greatest(cancellation_requested_at, provider_canceled_at, canceled_at),
  case when status = 'canceled' then 'canceled'
    when cancellation_provider_status = 'pending' then 'provider_pending' else 'scheduled' end,
  cancellation_effective_at, provider_canceled_at, cancellation_reason,
  cancellation_metadata ->> 'details',
  public.capture_cancellation_snapshot(id, external_id, cancellation_requested_at, null, true),
  jsonb_build_array(jsonb_build_object('label', 'Cancelamento solicitado', 'at', cancellation_requested_at))
from public.subscriptions where cancellation_mode = 'end_of_period'
  and cancellation_requested_at is not null and external_id is not null;

-- Approval/rejection entry points are retired, including service-role callers.
create or replace function public.approve_subscription_withdrawal(
  p_request_id uuid, p_admin_id uuid, p_reason text default null
) returns jsonb language plpgsql set search_path = '' as $$
begin raise exception 'A aprovação administrativa de arrependimento foi desativada.'; end;
$$;
create or replace function public.reject_subscription_withdrawal(
  p_request_id uuid, p_admin_id uuid, p_reason text
) returns jsonb language plpgsql set search_path = '' as $$
begin raise exception 'A recusa administrativa de arrependimento foi desativada.'; end;
$$;

create or replace function public.request_subscription_withdrawal(
  p_idempotency_key uuid,
  p_reason text default null,
  p_details text default null
)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_subscription public.subscriptions%rowtype;
  v_initial_payment public.student_payments%rowtype;
  v_existing_request public.subscription_withdrawal_requests%rowtype;
  v_request_id uuid;
  v_request_number integer;
  v_processing_mode text;
  v_activated_at timestamptz;
  v_deadline_at timestamptz;
  v_plan_credits integer := 0;
begin
  if v_user_id is null then
    raise exception 'Usuário não autenticado.';
  end if;

  if p_idempotency_key is null then
    raise exception 'Chave de idempotência não informada.';
  end if;

  select request.*
  into v_existing_request
  from public.subscription_withdrawal_requests request
  where request.student_id = v_user_id
    and request.idempotency_key = p_idempotency_key
  limit 1;

  if found then
    return jsonb_build_object(
      'request_id', v_existing_request.id,
      'processing_mode', v_existing_request.processing_mode,
      'status', v_existing_request.status,
      'provider_subscription_id', v_existing_request.provider_subscription_id,
      'subscription_id', v_existing_request.subscription_id,
      'original_activated_at', v_existing_request.original_activated_at,
      'duplicate', true
    );
  end if;

  select subscription.*
  into v_subscription
  from public.subscriptions subscription
  where subscription.user_id = v_user_id
  order by subscription.updated_at desc
  limit 1
  for update;

  if not found
    or v_subscription.status not in ('active', 'trial')
    or nullif(v_subscription.external_id, '') is null
  then
    raise exception 'Assinatura ativa não encontrada.';
  end if;

  select request.*
  into v_existing_request
  from public.subscription_withdrawal_requests request
  where request.provider_subscription_id = v_subscription.external_id
    and request.status <> 'rejected'
  limit 1;

  if found then
    return jsonb_build_object(
      'request_id', v_existing_request.id,
      'processing_mode', v_existing_request.processing_mode,
      'status', v_existing_request.status,
      'provider_subscription_id', v_existing_request.provider_subscription_id,
      'duplicate', true
    );
  end if;

  select payment.*
  into v_initial_payment
  from public.student_payments payment
  where payment.user_id = v_user_id
    and payment.subscription_id = v_subscription.id
    and payment.kind = 'subscription'
    and payment.status in ('paid', 'active')
    and payment.paid_at is not null
    and (
      payment.external_id = v_subscription.external_id
      or payment.metadata ->> 'pagarme_subscription_id' = v_subscription.external_id
    )
  order by payment.paid_at asc, payment.created_at asc
  limit 1;

  v_activated_at := coalesce(v_initial_payment.paid_at, v_subscription.current_period_start);

  if v_activated_at is null then
    raise exception 'Não foi possível determinar a aprovação do pagamento inicial.';
  end if;

  v_deadline_at := v_activated_at + interval '168 hours';

  if now() > v_deadline_at then
    raise exception 'A janela de arrependimento de 7 dias foi encerrada.';
  end if;

  select count(*)::integer + 1
  into v_request_number
  from public.subscription_withdrawal_requests request
  where request.student_id = v_user_id;

  v_processing_mode := 'automatic';

  select greatest(coalesce(credits.plan_credits, 0), 0)
  into v_plan_credits
  from public.student_credits credits
  where credits.user_id = v_user_id
  for update;

  v_plan_credits := coalesce(v_plan_credits, 0);

  insert into public.subscription_withdrawal_requests (
    student_id,
    subscription_id,
    provider_subscription_id,
    idempotency_key,
    initial_payment_id,
    original_activated_at,
    eligibility_deadline_at,
    request_number,
    processing_mode,
    status,
    blocked_plan_credits,
    cancellation_reason,
    cancellation_details
  ) values (
    v_user_id,
    v_subscription.id,
    v_subscription.external_id,
    p_idempotency_key,
    v_initial_payment.id,
    v_activated_at,
    v_deadline_at,
    v_request_number,
    v_processing_mode,
    case when v_processing_mode = 'automatic' then 'refund_processing' else 'under_review' end,
    v_plan_credits,
    nullif(btrim(p_reason), ''),
    nullif(btrim(p_details), '')
  )
  returning id into v_request_id;

  if v_plan_credits > 0 then
    insert into public.credit_transactions (
      user_id,
      type,
      amount,
      description,
      metadata
    ) values (
      v_user_id,
      'administrative_adjustment',
      -v_plan_credits,
      'Bloqueio de créditos por pedido de arrependimento',
      jsonb_build_object(
        'credit_type', 'plan',
        'adjustment_kind', 'withdrawal_hold',
        'withdrawal_request_id', v_request_id,
        'provider_subscription_id', v_subscription.external_id
      )
    );
  end if;

  update public.subscription_credit_allocations
  set
    available_at = 'infinity'::timestamptz,
    metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
      'withdrawal_request_id', v_request_id,
      'withdrawal_paused_at', now(),
      'withdrawal_original_available_at', available_at
    ),
    updated_at = now()
  where subscription_id = v_subscription.id
    and status = 'scheduled';

  update public.subscriptions
  set
    cancel_at_period_end = true,
    cancellation_mode = 'withdrawal',
    withdrawal_status = case when v_processing_mode = 'automatic' then 'refund_processing' else 'under_review' end,
    active_withdrawal_request_id = v_request_id,
    cancellation_requested_at = now(),
    cancellation_reason = nullif(btrim(p_reason), ''),
    cancellation_effective_at = null,
    pending_plan_id = null,
    pending_change_type = null,
    pending_change_at = null,
    updated_at = now()
  where id = v_subscription.id;

  return jsonb_build_object(
    'request_id', v_request_id,
    'processing_mode', v_processing_mode,
    'status', case when v_processing_mode = 'automatic' then 'refund_processing' else 'under_review' end,
    'provider_subscription_id', v_subscription.external_id,
    'subscription_id', v_subscription.id,
    'original_activated_at', v_activated_at,
    'eligibility_deadline_at', v_deadline_at,
    'blocked_plan_credits', v_plan_credits,
    'duplicate', false
  );
end;
$$;

commit;
