begin;

alter table public.subscriptions
  add column cancellation_mode text,
  add column withdrawal_status text,
  add column active_withdrawal_request_id uuid;

alter table public.subscriptions
  add constraint subscriptions_cancellation_mode_check
    check (cancellation_mode is null or cancellation_mode in ('end_of_period', 'withdrawal')),
  add constraint subscriptions_withdrawal_status_check
    check (
      withdrawal_status is null
      or withdrawal_status in (
        'under_review',
        'refund_processing',
        'refunded',
        'operational_issue'
      )
    );

update public.subscriptions
set cancellation_mode = 'end_of_period'
where cancel_at_period_end is true
  and cancellation_mode is null;

create table public.subscription_withdrawal_requests (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  subscription_id uuid not null references public.subscriptions(id) on delete cascade,
  provider_subscription_id text not null,
  idempotency_key uuid not null,
  initial_payment_id uuid references public.student_payments(id) on delete set null,
  original_activated_at timestamptz not null,
  eligibility_deadline_at timestamptz not null,
  request_number integer not null,
  processing_mode text not null,
  status text not null,
  requested_at timestamptz not null default now(),
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  review_reason text,
  refund_started_at timestamptz,
  refund_completed_at timestamptz,
  failure_at timestamptz,
  failure_stage text,
  failure_message text,
  provider_item_id text,
  blocked_plan_credits integer not null default 0,
  cancellation_reason text,
  cancellation_details text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint subscription_withdrawal_requests_provider_id_not_blank
    check (btrim(provider_subscription_id) <> ''),
  constraint subscription_withdrawal_requests_request_number_positive
    check (request_number > 0),
  constraint subscription_withdrawal_requests_blocked_credits_nonnegative
    check (blocked_plan_credits >= 0),
  constraint subscription_withdrawal_requests_processing_mode_check
    check (processing_mode in ('automatic', 'manual')),
  constraint subscription_withdrawal_requests_status_check
    check (status in ('under_review', 'refund_processing', 'refunded', 'rejected', 'operational_issue')),
  constraint subscription_withdrawal_requests_window_check
    check (eligibility_deadline_at = original_activated_at + interval '168 hours'),
  constraint subscription_withdrawal_requests_student_number_unique
    unique (student_id, request_number),
  constraint subscription_withdrawal_requests_student_idempotency_unique
    unique (student_id, idempotency_key)
);

create unique index subscription_withdrawal_requests_provider_unique
  on public.subscription_withdrawal_requests (provider_subscription_id)
  where status <> 'rejected';

create index subscription_withdrawal_requests_queue_idx
  on public.subscription_withdrawal_requests (status, requested_at);

create index subscription_withdrawal_requests_student_idx
  on public.subscription_withdrawal_requests (student_id, requested_at desc);

create table public.subscription_withdrawal_refunds (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.subscription_withdrawal_requests(id) on delete cascade,
  student_payment_id uuid references public.student_payments(id) on delete set null,
  provider_charge_id text not null,
  provider_invoice_id text,
  amount integer not null,
  status text not null default 'pending',
  idempotency_key text not null,
  provider_refund_id text,
  requested_at timestamptz,
  refunded_at timestamptz,
  failed_at timestamptz,
  failure_message text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint subscription_withdrawal_refunds_charge_not_blank
    check (btrim(provider_charge_id) <> ''),
  constraint subscription_withdrawal_refunds_amount_positive
    check (amount > 0),
  constraint subscription_withdrawal_refunds_status_check
    check (status in ('pending', 'processing', 'refunded', 'failed')),
  constraint subscription_withdrawal_refunds_request_charge_unique
    unique (request_id, provider_charge_id),
  constraint subscription_withdrawal_refunds_idempotency_unique
    unique (idempotency_key)
);

create index subscription_withdrawal_refunds_charge_idx
  on public.subscription_withdrawal_refunds (provider_charge_id);

alter table public.subscriptions
  add constraint subscriptions_active_withdrawal_request_fkey
  foreign key (active_withdrawal_request_id)
  references public.subscription_withdrawal_requests(id)
  on delete set null;

create or replace function public.set_subscription_withdrawal_updated_at()
returns trigger
language plpgsql
set search_path to ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger set_subscription_withdrawal_requests_updated_at
before update on public.subscription_withdrawal_requests
for each row execute function public.set_subscription_withdrawal_updated_at();

create trigger set_subscription_withdrawal_refunds_updated_at
before update on public.subscription_withdrawal_refunds
for each row execute function public.set_subscription_withdrawal_updated_at();

alter table public.subscription_withdrawal_requests enable row level security;
alter table public.subscription_withdrawal_refunds enable row level security;

revoke all on table public.subscription_withdrawal_requests from anon, authenticated;
revoke all on table public.subscription_withdrawal_refunds from anon, authenticated;
grant select on table public.subscription_withdrawal_requests to authenticated, service_role;
grant select, insert, update on table public.subscription_withdrawal_refunds to service_role;
grant insert, update on table public.subscription_withdrawal_requests to service_role;

create policy subscription_withdrawal_requests_student_select
on public.subscription_withdrawal_requests
for select to authenticated
using (student_id = auth.uid());

create policy subscription_withdrawal_requests_admin_select
on public.subscription_withdrawal_requests
for select to authenticated
using (public.get_my_role() = 'ADMIN');

create policy subscription_withdrawal_refunds_student_select
on public.subscription_withdrawal_refunds
for select to authenticated
using (
  exists (
    select 1
    from public.subscription_withdrawal_requests request
    where request.id = subscription_withdrawal_refunds.request_id
      and request.student_id = auth.uid()
  )
);

create policy subscription_withdrawal_refunds_admin_select
on public.subscription_withdrawal_refunds
for select to authenticated
using (public.get_my_role() = 'ADMIN');

create or replace function public.enrich_subscription_credit_origin()
returns trigger
language plpgsql
set search_path to ''
as $$
declare
  v_subscription_id uuid;
  v_provider_subscription_id text;
  v_contract_id uuid;
begin
  if new.type::text <> 'essay_usage'
    or coalesce(new.metadata ->> 'credit_type', 'plan') <> 'plan'
    or coalesce(new.metadata ->> 'plan_source', '') = 'mentorship'
  then
    return new;
  end if;

  select subscription.id, subscription.external_id
  into v_subscription_id, v_provider_subscription_id
  from public.subscriptions subscription
  where subscription.user_id = new.user_id
  order by subscription.updated_at desc
  limit 1;

  if v_subscription_id is not null then
    select contract.id
    into v_contract_id
    from public.subscription_contracts contract
    where contract.subscription_id = v_subscription_id
      and contract.status = 'active'
    order by contract.effective_at desc, contract.version desc
    limit 1;
  end if;

  new.metadata := coalesce(new.metadata, '{}'::jsonb) || jsonb_strip_nulls(
    jsonb_build_object(
      'subscription_id', v_subscription_id,
      'provider_subscription_id', v_provider_subscription_id,
      'subscription_contract_id', v_contract_id
    )
  );

  return new;
end;
$$;

create trigger enrich_subscription_credit_origin
before insert on public.credit_transactions
for each row execute function public.enrich_subscription_credit_origin();

create or replace function public.guard_refund_for_withdrawn_subscription_credit()
returns trigger
language plpgsql
set search_path to ''
as $$
declare
  v_provider_subscription_id text;
  v_request public.subscription_withdrawal_requests%rowtype;
begin
  if new.type::text <> 'essay_refund'
    or coalesce(new.metadata ->> 'credit_type', 'plan') <> 'plan'
    or coalesce(new.metadata ->> 'plan_source', '') = 'mentorship'
  then
    return new;
  end if;

  select transaction.metadata ->> 'provider_subscription_id'
  into v_provider_subscription_id
  from public.credit_transactions transaction
  where transaction.user_id = new.user_id
    and transaction.type::text = 'essay_usage'
    and transaction.metadata ->> 'essay_id' = new.metadata ->> 'essay_id'
  order by transaction.created_at desc
  limit 1;

  select request.*
  into v_request
  from public.subscription_withdrawal_requests request
  where request.student_id = new.user_id
    and (
      request.provider_subscription_id = v_provider_subscription_id
      or v_provider_subscription_id is null
    )
    and request.requested_at >= coalesce(
      (
        select essay.submission_date
        from public.essays essay
        where essay.id::text = new.metadata ->> 'essay_id'
      ),
      '-infinity'::timestamptz
    )
    and (
      request.status in ('refund_processing', 'refunded')
      or (
        request.status = 'operational_issue'
        and (
          request.processing_mode = 'automatic'
          or request.reviewed_at is not null
        )
      )
    )
  order by request.requested_at desc
  limit 1;

  if found then
    new.type := 'administrative_adjustment';
    new.amount := 0;
    new.description := 'Estorno de crédito suprimido após arrependimento';
    new.metadata := coalesce(new.metadata, '{}'::jsonb) || jsonb_build_object(
      'credit_type', 'plan',
      'adjustment_kind', 'withdrawal_refund_suppressed',
      'withdrawal_request_id', v_request.id,
      'provider_subscription_id', v_request.provider_subscription_id,
      'suppressed_at', now()
    );
  end if;

  return new;
end;
$$;

create trigger guard_refund_for_withdrawn_subscription_credit
before insert on public.credit_transactions
for each row execute function public.guard_refund_for_withdrawn_subscription_credit();

create or replace function public.hold_refunded_credit_during_withdrawal_review()
returns trigger
language plpgsql
set search_path to ''
as $$
declare
  v_request_id uuid;
begin
  if new.type::text <> 'essay_refund'
    or coalesce(new.metadata ->> 'credit_type', 'plan') <> 'plan'
    or coalesce(new.metadata ->> 'plan_source', '') = 'mentorship'
  then
    return new;
  end if;

  select request.id
  into v_request_id
  from public.subscription_withdrawal_requests request
  where request.student_id = new.user_id
    and request.status in ('under_review', 'operational_issue')
    and request.processing_mode = 'manual'
    and request.reviewed_at is null
    and request.requested_at >= coalesce(
      (
        select essay.submission_date
        from public.essays essay
        where essay.id::text = new.metadata ->> 'essay_id'
      ),
      '-infinity'::timestamptz
    )
  order by request.requested_at desc
  limit 1;

  if v_request_id is not null then
    insert into public.credit_transactions (
      user_id,
      type,
      amount,
      description,
      metadata
    ) values (
      new.user_id,
      'administrative_adjustment',
      -new.amount,
      'Bloqueio de crédito estornado durante análise de arrependimento',
      jsonb_build_object(
        'credit_type', 'plan',
        'adjustment_kind', 'withdrawal_hold',
        'withdrawal_request_id', v_request_id,
        'source_transaction_id', new.id
      )
    );

    update public.subscription_withdrawal_requests
    set blocked_plan_credits = blocked_plan_credits + new.amount
    where id = v_request_id;
  end if;

  return new;
end;
$$;

create trigger hold_refunded_credit_during_withdrawal_review
after insert on public.credit_transactions
for each row execute function public.hold_refunded_credit_during_withdrawal_review();

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

  v_processing_mode := case when v_request_number = 1 then 'automatic' else 'manual' end;

  select greatest(coalesce(credits.plan_credits, 0), 0)
  into v_plan_credits
  from public.student_credits credits
  where credits.user_id = v_user_id;

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

revoke all on function public.request_subscription_withdrawal(uuid, text, text) from public, anon;
grant execute on function public.request_subscription_withdrawal(uuid, text, text) to authenticated;

create or replace function public.set_subscription_withdrawal_provider_hold(
  p_request_id uuid,
  p_provider_item_id text
)
returns void
language plpgsql
security definer
set search_path to ''
as $$
begin
  if coalesce(auth.jwt() ->> 'role', '') <> 'service_role' then
    raise exception 'Acesso não autorizado.';
  end if;

  update public.subscription_withdrawal_requests
  set provider_item_id = nullif(btrim(p_provider_item_id), '')
  where id = p_request_id
    and processing_mode = 'manual'
    and status = 'under_review';

  if not found then
    raise exception 'Solicitação de arrependimento em análise não encontrada.';
  end if;
end;
$$;

create or replace function public.approve_subscription_withdrawal(
  p_request_id uuid,
  p_admin_id uuid,
  p_reason text default null
)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_request public.subscription_withdrawal_requests%rowtype;
begin
  if coalesce(auth.jwt() ->> 'role', '') <> 'service_role' then
    raise exception 'Acesso não autorizado.';
  end if;

  if not exists (
    select 1 from public.profiles profile
    where profile.id = p_admin_id and profile.role = 'ADMIN'
  ) then
    raise exception 'Administrador inválido.';
  end if;

  update public.subscription_withdrawal_requests
  set
    status = 'refund_processing',
    reviewed_by = p_admin_id,
    reviewed_at = now(),
    review_reason = nullif(btrim(p_reason), ''),
    failure_at = null,
    failure_stage = null,
    failure_message = null,
    refund_started_at = now()
  where id = p_request_id
    and processing_mode = 'manual'
    and status in ('under_review', 'operational_issue')
    and reviewed_at is null
  returning * into v_request;

  if not found then
    raise exception 'Solicitação de arrependimento não está disponível para aprovação.';
  end if;

  update public.subscriptions
  set withdrawal_status = 'refund_processing', updated_at = now()
  where id = v_request.subscription_id;

  update public.subscription_credit_allocations
  set
    status = 'skipped',
    metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
      'skipped_reason', 'subscription_withdrawal',
      'withdrawal_request_id', v_request.id,
      'skipped_at', now()
    ),
    updated_at = now()
  where subscription_id = v_request.subscription_id
    and status = 'scheduled';

  return jsonb_build_object(
    'request_id', v_request.id,
    'provider_subscription_id', v_request.provider_subscription_id,
    'subscription_id', v_request.subscription_id
  );
end;
$$;

create or replace function public.reject_subscription_withdrawal(
  p_request_id uuid,
  p_admin_id uuid,
  p_reason text
)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_request public.subscription_withdrawal_requests%rowtype;
  v_held_credits integer := 0;
begin
  if coalesce(auth.jwt() ->> 'role', '') <> 'service_role' then
    raise exception 'Acesso não autorizado.';
  end if;

  if nullif(btrim(p_reason), '') is null then
    raise exception 'Informe o motivo da recusa.';
  end if;

  if not exists (
    select 1 from public.profiles profile
    where profile.id = p_admin_id and profile.role = 'ADMIN'
  ) then
    raise exception 'Administrador inválido.';
  end if;

  select request.*
  into v_request
  from public.subscription_withdrawal_requests request
  where request.id = p_request_id
    and request.processing_mode = 'manual'
    and request.status in ('under_review', 'operational_issue')
    and request.reviewed_at is null
  for update;

  if not found then
    raise exception 'Solicitação de arrependimento não está disponível para recusa.';
  end if;

  select coalesce(-sum(transaction.amount), 0)::integer
  into v_held_credits
  from public.credit_transactions transaction
  where transaction.user_id = v_request.student_id
    and transaction.type::text = 'administrative_adjustment'
    and transaction.metadata ->> 'adjustment_kind' = 'withdrawal_hold'
    and transaction.metadata ->> 'withdrawal_request_id' = v_request.id::text;

  if v_held_credits > 0 then
    insert into public.credit_transactions (user_id, type, amount, description, metadata)
    values (
      v_request.student_id,
      'administrative_adjustment',
      v_held_credits,
      'Liberação de créditos após recusa do arrependimento',
      jsonb_build_object(
        'credit_type', 'plan',
        'adjustment_kind', 'withdrawal_hold_release',
        'withdrawal_request_id', v_request.id,
        'provider_subscription_id', v_request.provider_subscription_id
      )
    );
  end if;

  update public.subscription_withdrawal_requests
  set
    status = 'rejected',
    reviewed_by = p_admin_id,
    reviewed_at = now(),
    review_reason = btrim(p_reason),
    failure_at = null,
    failure_stage = null,
    failure_message = null
  where id = v_request.id;

  update public.subscriptions
  set
    cancel_at_period_end = false,
    cancellation_mode = null,
    withdrawal_status = null,
    active_withdrawal_request_id = null,
    cancellation_requested_at = null,
    cancellation_effective_at = null,
    cancellation_reason = null,
    cancellation_provider_status = 'active',
    provider_canceled_at = null,
    updated_at = now()
  where id = v_request.subscription_id;

  update public.subscription_credit_allocations
  set
    available_at = (metadata ->> 'withdrawal_original_available_at')::timestamptz,
    metadata = metadata - 'withdrawal_request_id' - 'withdrawal_paused_at' - 'withdrawal_original_available_at',
    updated_at = now()
  where subscription_id = v_request.subscription_id
    and status = 'scheduled'
    and metadata ->> 'withdrawal_request_id' = v_request.id::text
    and metadata ->> 'withdrawal_original_available_at' is not null;

  return jsonb_build_object(
    'request_id', v_request.id,
    'provider_subscription_id', v_request.provider_subscription_id,
    'provider_item_id', v_request.provider_item_id,
    'released_plan_credits', v_held_credits
  );
end;
$$;

create or replace function public.mark_subscription_withdrawal_operational_issue(
  p_request_id uuid,
  p_stage text,
  p_message text
)
returns void
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_subscription_id uuid;
begin
  if coalesce(auth.jwt() ->> 'role', '') <> 'service_role' then
    raise exception 'Acesso não autorizado.';
  end if;

  update public.subscription_withdrawal_requests
  set
    status = 'operational_issue',
    failure_at = now(),
    failure_stage = nullif(btrim(p_stage), ''),
    failure_message = left(coalesce(nullif(btrim(p_message), ''), 'Falha operacional não detalhada.'), 1000)
  where id = p_request_id
    and status not in ('refunded', 'rejected')
  returning subscription_id into v_subscription_id;

  if not found then
    raise exception 'Solicitação de arrependimento ativa não encontrada.';
  end if;

  update public.subscriptions
  set withdrawal_status = 'operational_issue', updated_at = now()
  where id = v_subscription_id;
end;
$$;

create or replace function public.process_subscription_withdrawal_refund_confirmation(
  p_provider_charge_id text,
  p_refunded_at timestamptz,
  p_provider_refund_id text default null
)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_refund public.subscription_withdrawal_refunds%rowtype;
  v_request public.subscription_withdrawal_requests%rowtype;
  v_pending_count integer;
  v_held_credits integer := 0;
begin
  if coalesce(auth.jwt() ->> 'role', '') <> 'service_role' then
    raise exception 'Acesso não autorizado.';
  end if;

  select refund.*
  into v_refund
  from public.subscription_withdrawal_refunds refund
  where refund.provider_charge_id = p_provider_charge_id
  order by refund.created_at desc
  limit 1
  for update;

  if not found then
    return jsonb_build_object('matched', false, 'completed', false);
  end if;

  update public.subscription_withdrawal_refunds
  set
    status = 'refunded',
    refunded_at = coalesce(p_refunded_at, now()),
    provider_refund_id = coalesce(nullif(p_provider_refund_id, ''), provider_refund_id),
    failed_at = null,
    failure_message = null
  where id = v_refund.id;

  select request.*
  into v_request
  from public.subscription_withdrawal_requests request
  where request.id = v_refund.request_id
  for update;

  if v_request.status = 'refunded' then
    return jsonb_build_object('matched', true, 'completed', true, 'request_id', v_request.id);
  end if;

  select count(*)::integer
  into v_pending_count
  from public.subscription_withdrawal_refunds refund
  where refund.request_id = v_request.id
    and refund.status <> 'refunded';

  if v_pending_count > 0 then
    return jsonb_build_object('matched', true, 'completed', false, 'request_id', v_request.id);
  end if;

  select coalesce(-sum(transaction.amount), 0)::integer
  into v_held_credits
  from public.credit_transactions transaction
  where transaction.user_id = v_request.student_id
    and transaction.type::text = 'administrative_adjustment'
    and transaction.metadata ->> 'adjustment_kind' = 'withdrawal_hold'
    and transaction.metadata ->> 'withdrawal_request_id' = v_request.id::text;

  if v_held_credits > 0 then
    insert into public.credit_transactions (user_id, type, amount, description, metadata)
    values (
      v_request.student_id,
      'administrative_adjustment',
      v_held_credits,
      'Conversão do bloqueio após confirmação do reembolso',
      jsonb_build_object(
        'credit_type', 'plan',
        'adjustment_kind', 'withdrawal_hold_release_for_expiration',
        'withdrawal_request_id', v_request.id,
        'provider_subscription_id', v_request.provider_subscription_id
      )
    );

    insert into public.credit_transactions (user_id, type, amount, description, metadata)
    values (
      v_request.student_id,
      'plan_expiration',
      -v_held_credits,
      'Invalidação de créditos após reembolso da assinatura',
      jsonb_build_object(
        'credit_type', 'plan',
        'expiration_reason', 'subscription_withdrawal',
        'withdrawal_request_id', v_request.id,
        'provider_subscription_id', v_request.provider_subscription_id
      )
    );
  end if;

  update public.subscription_withdrawal_requests
  set
    status = 'refunded',
    refund_completed_at = coalesce(p_refunded_at, now()),
    failure_at = null,
    failure_stage = null,
    failure_message = null
  where id = v_request.id;

  update public.subscriptions
  set
    status = 'canceled',
    cancel_at_period_end = false,
    cancellation_mode = 'withdrawal',
    withdrawal_status = 'refunded',
    active_withdrawal_request_id = null,
    cancellation_effective_at = coalesce(p_refunded_at, now()),
    canceled_at = coalesce(canceled_at, p_refunded_at, now()),
    updated_at = now()
  where id = v_request.subscription_id;

  update public.subscription_credit_allocations
  set
    status = 'skipped',
    metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
      'skipped_reason', 'subscription_withdrawal',
      'withdrawal_request_id', v_request.id,
      'skipped_at', now()
    ),
    updated_at = now()
  where subscription_id = v_request.subscription_id
    and status = 'scheduled';

  return jsonb_build_object(
    'matched', true,
    'completed', true,
    'request_id', v_request.id,
    'invalidated_plan_credits', v_held_credits
  );
end;
$$;

create or replace function public.enforce_extra_credit_withdrawal_gate()
returns trigger
language plpgsql
set search_path to ''
as $$
begin
  if new.kind <> 'extra_credits' then
    return new;
  end if;

  if not exists (
    select 1
    from public.subscriptions subscription
    where subscription.id = new.subscription_id
      and subscription.user_id = new.user_id
      and subscription.status in ('active', 'trial')
  ) then
    raise exception 'Créditos extras exigem uma assinatura ativa.';
  end if;

  if exists (
    select 1
    from public.subscription_withdrawal_requests request
    where request.student_id = new.user_id
      and request.status in ('under_review', 'refund_processing', 'operational_issue')
  ) then
    raise exception 'A compra de créditos extras está bloqueada durante o arrependimento.';
  end if;

  return new;
end;
$$;

create trigger enforce_extra_credit_withdrawal_gate
before insert on public.student_payments
for each row execute function public.enforce_extra_credit_withdrawal_gate();

create or replace function public.reset_withdrawal_state_for_new_subscription()
returns trigger
language plpgsql
set search_path to ''
as $$
begin
  if new.external_id is distinct from old.external_id
    and new.status in ('active', 'trial')
  then
    new.cancellation_mode := null;
    new.withdrawal_status := null;
    new.active_withdrawal_request_id := null;
  end if;

  return new;
end;
$$;

create trigger reset_withdrawal_state_for_new_subscription
before update on public.subscriptions
for each row execute function public.reset_withdrawal_state_for_new_subscription();

revoke all on function public.set_subscription_withdrawal_provider_hold(uuid, text) from public, anon, authenticated;
revoke all on function public.approve_subscription_withdrawal(uuid, uuid, text) from public, anon, authenticated;
revoke all on function public.reject_subscription_withdrawal(uuid, uuid, text) from public, anon, authenticated;
revoke all on function public.mark_subscription_withdrawal_operational_issue(uuid, text, text) from public, anon, authenticated;
revoke all on function public.process_subscription_withdrawal_refund_confirmation(text, timestamptz, text) from public, anon, authenticated;

grant execute on function public.set_subscription_withdrawal_provider_hold(uuid, text) to service_role;
grant execute on function public.approve_subscription_withdrawal(uuid, uuid, text) to service_role;
grant execute on function public.reject_subscription_withdrawal(uuid, uuid, text) to service_role;
grant execute on function public.mark_subscription_withdrawal_operational_issue(uuid, text, text) to service_role;
grant execute on function public.process_subscription_withdrawal_refund_confirmation(text, timestamptz, text) to service_role;

alter function public.process_pagarme_subscription_cancellation(uuid, text, text, timestamptz)
  rename to process_pagarme_subscription_cancellation_legacy;

create function public.process_pagarme_subscription_cancellation(
  p_webhook_event_id uuid,
  p_subscription_external_id text,
  p_subscription_status text,
  p_canceled_at timestamptz default null
)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_event public.pagarme_webhook_events%rowtype;
  v_subscription public.subscriptions%rowtype;
  v_canceled_at timestamptz := coalesce(p_canceled_at, now());
begin
  if coalesce(auth.jwt() ->> 'role', '') <> 'service_role' then
    raise exception 'Acesso não autorizado.';
  end if;

  select subscription.*
  into v_subscription
  from public.subscriptions subscription
  where subscription.external_id = p_subscription_external_id
  for update;

  if found
    and v_subscription.cancellation_mode = 'withdrawal'
    and v_subscription.withdrawal_status in (
      'under_review',
      'refund_processing',
      'operational_issue'
    )
  then
    select event.*
    into v_event
    from public.pagarme_webhook_events event
    where event.id = p_webhook_event_id
    for update;

    if not found
      or v_event.event_type <> 'subscription.canceled'
      or lower(coalesce(p_subscription_status, '')) <> 'canceled'
      or nullif(v_event.payload #>> '{data,id}', '') is distinct from p_subscription_external_id
      or lower(coalesce(v_event.payload #>> '{data,status}', '')) <> 'canceled'
    then
      raise exception 'Evento de cancelamento da assinatura inválido.';
    end if;

    if v_event.status = 'processed' then
      return jsonb_build_object(
        'success', true,
        'duplicate', true,
        'ignored', false,
        'reason', 'withdrawal_refund_pending',
        'subscription_id', v_subscription.id,
        'current_status', v_subscription.status,
        'credits_expired', 0,
        'webhook_event_id', p_webhook_event_id
      );
    end if;

    update public.subscriptions
    set
      cancellation_provider_status = 'canceled',
      provider_canceled_at = coalesce(provider_canceled_at, v_canceled_at),
      cancellation_metadata = coalesce(cancellation_metadata, '{}'::jsonb) || jsonb_build_object(
        'provider_status', 'canceled',
        'provider_canceled_at', v_canceled_at,
        'last_cancellation_webhook_id', p_webhook_event_id,
        'cancellation_state', 'withdrawal_refund_pending'
      ),
      updated_at = now()
    where id = v_subscription.id;

    update public.pagarme_webhook_events
    set status = 'processed', processed_at = now(), error_message = null, updated_at = now()
    where id = p_webhook_event_id;

    return jsonb_build_object(
      'success', true,
      'duplicate', false,
      'ignored', false,
      'reason', 'withdrawal_refund_pending',
      'subscription_id', v_subscription.id,
      'current_status', v_subscription.status,
      'credits_expired', 0,
      'webhook_event_id', p_webhook_event_id
    );
  end if;

  return public.process_pagarme_subscription_cancellation_legacy(
    p_webhook_event_id,
    p_subscription_external_id,
    p_subscription_status,
    p_canceled_at
  );
end;
$$;

revoke all on function public.process_pagarme_subscription_cancellation(uuid, text, text, timestamptz)
  from public, anon, authenticated;
grant execute on function public.process_pagarme_subscription_cancellation(uuid, text, text, timestamptz)
  to service_role;

commit;
