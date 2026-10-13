-- Central, append-only activity feed for administrative actions.
-- Existing domain histories remain the source of truth; this table indexes
-- those actions for support visibility and records new cross-domain actions.
-- Rollback: drop the triggers/functions below, drop registered_by from
-- teacher_payments, then drop admin_audit_events. Preserve an export first.
begin;

create table public.admin_audit_events (
  id uuid primary key default gen_random_uuid(),
  operation_id uuid not null unique,
  actor_id uuid references public.profiles(id) on delete set null,
  subject_id uuid references public.profiles(id) on delete set null,
  action text not null check (length(btrim(action)) between 3 and 120),
  resource_type text not null check (length(btrim(resource_type)) between 3 and 80),
  resource_id text,
  status text not null default 'success'
    check (status in ('pending', 'success', 'failure', 'operational_issue')),
  summary text not null check (length(btrim(summary)) between 3 and 500),
  changes jsonb not null default '{}'::jsonb
    check (jsonb_typeof(changes) = 'object'),
  metadata jsonb not null default '{}'::jsonb
    check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now()
);

comment on table public.admin_audit_events is
  'Append-only index of administrative activity. Domain-specific histories remain authoritative.';
comment on column public.admin_audit_events.metadata is
  'Sanitized operational context only. Never store credentials, reset tokens, card data or secrets.';

create index admin_audit_events_created_idx
  on public.admin_audit_events (created_at desc);
create index admin_audit_events_actor_created_idx
  on public.admin_audit_events (actor_id, created_at desc);
create index admin_audit_events_subject_created_idx
  on public.admin_audit_events (subject_id, created_at desc);
create index admin_audit_events_resource_created_idx
  on public.admin_audit_events (resource_type, created_at desc);
create index admin_audit_events_action_created_idx
  on public.admin_audit_events (action, created_at desc);

alter table public.admin_audit_events enable row level security;
revoke all on table public.admin_audit_events from public, anon, authenticated;
grant select on table public.admin_audit_events to authenticated;
grant all privileges on table public.admin_audit_events to service_role;

create policy "Admins read administrative activity"
  on public.admin_audit_events
  for select
  to authenticated
  using (public.get_my_role() = 'ADMIN');

create function public.record_admin_audit_event(
  p_operation_id uuid,
  p_action text,
  p_resource_type text,
  p_resource_id text,
  p_subject_id uuid,
  p_status text,
  p_summary text,
  p_changes jsonb default '{}'::jsonb,
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid := auth.uid();
  v_event_id uuid;
begin
  if v_actor_id is null or public.get_my_role() is distinct from 'ADMIN' then
    raise exception 'Acesso não autorizado.';
  end if;

  if p_operation_id is null
    or length(btrim(coalesce(p_action, ''))) not between 3 and 120
    or length(btrim(coalesce(p_resource_type, ''))) not between 3 and 80
    or length(btrim(coalesce(p_summary, ''))) not between 3 and 500
    or p_status is null
    or p_status not in ('pending', 'success', 'failure', 'operational_issue')
    or jsonb_typeof(coalesce(p_changes, '{}'::jsonb)) <> 'object'
    or jsonb_typeof(coalesce(p_metadata, '{}'::jsonb)) <> 'object'
  then
    raise exception 'Evento administrativo inválido.';
  end if;

  insert into public.admin_audit_events (
    operation_id, actor_id, subject_id, action, resource_type,
    resource_id, status, summary, changes, metadata
  ) values (
    p_operation_id, v_actor_id, p_subject_id, btrim(p_action),
    btrim(p_resource_type), nullif(btrim(coalesce(p_resource_id, '')), ''),
    p_status, btrim(p_summary), coalesce(p_changes, '{}'::jsonb),
    coalesce(p_metadata, '{}'::jsonb)
  )
  on conflict (operation_id) do nothing
  returning id into v_event_id;

  if v_event_id is null then
    select id into v_event_id
    from public.admin_audit_events
    where operation_id = p_operation_id;
  end if;

  return v_event_id;
end;
$$;

revoke all on function public.record_admin_audit_event(
  uuid, text, text, text, uuid, text, text, jsonb, jsonb
) from public, anon;
grant execute on function public.record_admin_audit_event(
  uuid, text, text, text, uuid, text, text, jsonb, jsonb
) to authenticated;

create function public.update_student_profile_by_admin(
  p_operation_id uuid,
  p_student_id uuid,
  p_full_name text,
  p_phone text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid := auth.uid();
  v_current public.profiles%rowtype;
  v_name text := btrim(coalesce(p_full_name, ''));
  v_phone text := regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g');
  v_changes jsonb := '{}'::jsonb;
begin
  if v_actor_id is null or public.get_my_role() is distinct from 'ADMIN' then
    raise exception 'Acesso não autorizado.';
  end if;

  if p_operation_id is null
    or p_student_id is null
    or length(v_name) not between 3 and 120
    or v_phone !~ '^[0-9]{10,11}$'
  then
    raise exception 'Dados do aluno inválidos.';
  end if;

  select * into v_current
  from public.profiles
  where id = p_student_id and role = 'STUDENT'
  for update;

  if not found then
    raise exception 'Aluno não encontrado.';
  end if;

  if v_current.full_name is distinct from v_name then
    v_changes := v_changes || jsonb_build_object(
      'full_name', jsonb_build_object('from', v_current.full_name, 'to', v_name)
    );
  end if;

  if v_current.phone is distinct from v_phone then
    v_changes := v_changes || jsonb_build_object(
      'phone', jsonb_build_object(
        'from', case when v_current.phone is null then null else '***' || right(v_current.phone, 4) end,
        'to', '***' || right(v_phone, 4)
      )
    );
  end if;

  if v_changes = '{}'::jsonb then
    return jsonb_build_object('changed', false);
  end if;

  update public.profiles
  set full_name = v_name, phone = v_phone
  where id = p_student_id;

  insert into public.admin_audit_events (
    operation_id, actor_id, subject_id, action, resource_type,
    resource_id, status, summary, changes
  ) values (
    p_operation_id, v_actor_id, p_student_id,
    'student.profile_updated', 'student_profile', p_student_id::text,
    'success', 'Dados permitidos do aluno atualizados', v_changes
  );

  return jsonb_build_object('changed', true, 'changes', v_changes);
end;
$$;

revoke all on function public.update_student_profile_by_admin(uuid, uuid, text, text)
  from public, anon;
grant execute on function public.update_student_profile_by_admin(uuid, uuid, text, text)
  to authenticated;

create function public.set_student_status_by_admin(
  p_operation_id uuid,
  p_student_id uuid,
  p_status text
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid := auth.uid();
  v_current_status text;
begin
  if v_actor_id is null or public.get_my_role() is distinct from 'ADMIN' then
    raise exception 'Acesso não autorizado.';
  end if;

  if p_operation_id is null
    or p_student_id is null
    or p_status is null
    or p_status not in ('active', 'blocked')
  then
    raise exception 'Status do aluno inválido.';
  end if;

  select status into v_current_status
  from public.profiles
  where id = p_student_id and role = 'STUDENT'
  for update;

  if not found then
    raise exception 'Aluno não encontrado.';
  end if;

  if v_current_status = p_status then
    return v_current_status;
  end if;

  update public.profiles set status = p_status where id = p_student_id;

  insert into public.admin_audit_events (
    operation_id, actor_id, subject_id, action, resource_type,
    resource_id, status, summary, changes
  ) values (
    p_operation_id, v_actor_id, p_student_id,
    case when p_status = 'blocked' then 'student.blocked' else 'student.unblocked' end,
    'student_profile', p_student_id::text, 'success',
    case when p_status = 'blocked' then 'Aluno bloqueado' else 'Aluno desbloqueado' end,
    jsonb_build_object(
      'status', jsonb_build_object('from', v_current_status, 'to', p_status)
    )
  );

  return p_status;
end;
$$;

revoke all on function public.set_student_status_by_admin(uuid, uuid, text)
  from public, anon;
grant execute on function public.set_student_status_by_admin(uuid, uuid, text)
  to authenticated;

create function public.audit_correction_review_action()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_teacher_id uuid;
  v_student_id uuid;
  v_essay_id uuid;
  v_summary text;
begin
  select submission.teacher_id, essay.student_id, submission.essay_id
  into v_teacher_id, v_student_id, v_essay_id
  from public.correction_review_submissions as submission
  join public.essays as essay on essay.id = submission.essay_id
  where submission.id = new.submission_id;

  v_summary := case new.action
    when 'approved' then 'Correção aprovada pelo administrador'
    when 'approved_with_changes' then 'Correção aprovada com alterações pelo administrador'
    else 'Correção devolvida ao professor pelo administrador'
  end;

  insert into public.admin_audit_events (
    operation_id, actor_id, subject_id, action, resource_type,
    resource_id, status, summary, changes, metadata, created_at
  ) values (
    new.id, new.admin_id, v_teacher_id,
    'correction_review.' || new.action, 'correction_review',
    new.submission_id::text, 'success', v_summary, new.changes,
    jsonb_strip_nulls(jsonb_build_object(
      'essay_id', v_essay_id,
      'student_id', v_student_id,
      'feedback', new.feedback
    )),
    new.created_at
  ) on conflict (operation_id) do nothing;

  return new;
end;
$$;

revoke all on function public.audit_correction_review_action()
  from public, anon, authenticated;

create trigger audit_correction_review_action_after_insert
after insert on public.correction_review_actions
for each row execute function public.audit_correction_review_action();

create function public.audit_manual_credit_grant()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.admin_audit_events (
    operation_id, actor_id, subject_id, action, resource_type,
    resource_id, status, summary, metadata, created_at
  ) values (
    new.id, new.administrator_id, new.student_id,
    'student.credit_granted', 'manual_credit_grant', new.id::text,
    'success', 'Créditos concedidos manualmente ao aluno',
    jsonb_strip_nulls(jsonb_build_object(
      'credit_type', new.credit_type,
      'amount', new.amount,
      'reason', new.reason,
      'expires_at', new.expires_at
    )),
    new.created_at
  ) on conflict (operation_id) do nothing;

  return new;
end;
$$;

revoke all on function public.audit_manual_credit_grant()
  from public, anon, authenticated;

create trigger audit_manual_credit_grant_after_insert
after insert on public.manual_credit_grants
for each row execute function public.audit_manual_credit_grant();

create function public.audit_subscription_support_operation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_event_status text;
  v_event_action text;
  v_summary text;
begin
  if tg_op = 'UPDATE' and new.status is not distinct from old.status then
    return new;
  end if;

  v_event_status := case new.status
    when 'completed' then 'success'
    when 'operational_issue' then 'operational_issue'
    else 'pending'
  end;
  v_event_action := case
    when tg_op = 'INSERT' then 'subscription_support.' || new.action
    else 'subscription_support.status_changed'
  end;
  v_summary := case
    when tg_op = 'INSERT' then 'Atendimento de assinatura iniciado'
    when new.status = 'completed' then 'Atendimento de assinatura concluído'
    when new.status = 'operational_issue' then 'Atendimento de assinatura requer atenção operacional'
    else 'Atendimento de assinatura atualizado'
  end;

  insert into public.admin_audit_events (
    operation_id, actor_id, subject_id, action, resource_type,
    resource_id, status, summary, metadata, created_at
  ) values (
    case when tg_op = 'INSERT' then new.id else gen_random_uuid() end,
    new.actor_id, new.student_id, v_event_action,
    'subscription_support', new.id::text, v_event_status, v_summary,
    jsonb_build_object(
      'support_action', new.action,
      'operation_status', new.status,
      'amount', new.amount,
      'provider_canceled', new.provider_canceled,
      'refund_confirmed', new.refund_confirmed
    ),
    case when tg_op = 'INSERT' then new.created_at else new.updated_at end
  ) on conflict (operation_id) do nothing;

  return new;
end;
$$;

revoke all on function public.audit_subscription_support_operation()
  from public, anon, authenticated;

create trigger audit_subscription_support_operation_after_write
after insert or update on public.subscription_support_operations
for each row execute function public.audit_subscription_support_operation();

alter table public.teacher_payments
  add column registered_by uuid references public.profiles(id) on delete set null;

create index teacher_payments_registered_by_idx
  on public.teacher_payments (registered_by, created_at desc);

create function public.audit_teacher_payment()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.registered_by is null then
    return new;
  end if;

  insert into public.admin_audit_events (
    operation_id, actor_id, subject_id, action, resource_type,
    resource_id, status, summary, metadata, created_at
  ) values (
    new.id, new.registered_by, new.teacher_id,
    'teacher.payment_registered', 'teacher_payment', new.id::text,
    'success', 'Pagamento de professor registrado',
    jsonb_build_object(
      'billing_month', new.billing_month,
      'total_amount', new.total_amount,
      'essays_count', new.essays_count,
      'payment_status', new.status
    ),
    new.created_at
  ) on conflict (operation_id) do nothing;

  return new;
end;
$$;

revoke all on function public.audit_teacher_payment()
  from public, anon, authenticated;

create trigger audit_teacher_payment_after_insert
after insert on public.teacher_payments
for each row execute function public.audit_teacher_payment();

-- Consolidate reliable existing histories. Rows without an identified actor
-- are intentionally not attributed to an administrator.
insert into public.admin_audit_events (
  operation_id, actor_id, subject_id, action, resource_type,
  resource_id, status, summary, changes, metadata, created_at
)
select
  action.id,
  action.admin_id,
  submission.teacher_id,
  'correction_review.' || action.action,
  'correction_review',
  action.submission_id::text,
  'success',
  case action.action
    when 'approved' then 'Correção aprovada pelo administrador'
    when 'approved_with_changes' then 'Correção aprovada com alterações pelo administrador'
    else 'Correção devolvida ao professor pelo administrador'
  end,
  action.changes,
  jsonb_strip_nulls(jsonb_build_object(
    'essay_id', submission.essay_id,
    'student_id', essay.student_id,
    'feedback', action.feedback
  )),
  action.created_at
from public.correction_review_actions as action
join public.correction_review_submissions as submission
  on submission.id = action.submission_id
join public.essays as essay on essay.id = submission.essay_id
on conflict (operation_id) do nothing;

insert into public.admin_audit_events (
  operation_id, actor_id, subject_id, action, resource_type,
  resource_id, status, summary, metadata, created_at
)
select
  grant_record.id,
  grant_record.administrator_id,
  grant_record.student_id,
  'student.credit_granted',
  'manual_credit_grant',
  grant_record.id::text,
  'success',
  'Créditos concedidos manualmente ao aluno',
  jsonb_strip_nulls(jsonb_build_object(
    'credit_type', grant_record.credit_type,
    'amount', grant_record.amount,
    'reason', grant_record.reason,
    'expires_at', grant_record.expires_at
  )),
  grant_record.created_at
from public.manual_credit_grants as grant_record
on conflict (operation_id) do nothing;

insert into public.admin_audit_events (
  operation_id, actor_id, subject_id, action, resource_type,
  resource_id, status, summary, metadata, created_at
)
select
  operation.id,
  operation.actor_id,
  operation.student_id,
  'subscription_support.' || operation.action,
  'subscription_support',
  operation.id::text,
  case operation.status
    when 'completed' then 'success'
    when 'operational_issue' then 'operational_issue'
    else 'pending'
  end,
  case operation.status
    when 'completed' then 'Atendimento de assinatura concluído'
    when 'operational_issue' then 'Atendimento de assinatura requer atenção operacional'
    else 'Atendimento de assinatura em andamento'
  end,
  jsonb_build_object(
    'support_action', operation.action,
    'operation_status', operation.status,
    'amount', operation.amount,
    'provider_canceled', operation.provider_canceled,
    'refund_confirmed', operation.refund_confirmed
  ),
  operation.created_at
from public.subscription_support_operations as operation
on conflict (operation_id) do nothing;

commit;
