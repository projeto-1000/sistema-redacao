-- Atomic, idempotent administrative credit grants.
-- Rollback: drop grant_manual_credits, drop manual_credit_grants and remove
-- mentorship_credit_allocations.administrative_grants after confirming that no
-- manual mentorship grant has been recorded.
begin;

alter table public.mentorship_credit_allocations
  add column administrative_grants integer not null default 0;

alter table public.mentorship_credit_allocations
  add constraint mentorship_credit_allocations_administrative_grants_check
    check (administrative_grants >= 0);

alter table public.mentorship_credit_allocations
  drop constraint mentorship_credit_allocations_remaining_check;

alter table public.mentorship_credit_allocations
  add constraint mentorship_credit_allocations_remaining_check
    check (
      remaining_amount >= 0
      and remaining_amount <= amount + compensatory_refunds + administrative_grants
    );

create table public.manual_credit_grants (
  id uuid primary key,
  student_id uuid not null references public.profiles(id) on delete restrict,
  administrator_id uuid not null references public.profiles(id) on delete restrict,
  credit_type text not null,
  amount integer not null,
  reason text not null,
  internal_note text,
  expires_at timestamptz,
  subscription_id uuid references public.subscriptions(id) on delete restrict,
  mentorship_allocation_id uuid references public.mentorship_credit_allocations(id) on delete restrict,
  credit_transaction_id uuid not null unique references public.credit_transactions(id) on delete restrict,
  created_at timestamptz not null default now(),
  constraint manual_credit_grants_credit_type_check
    check (credit_type in ('mentorship', 'plan', 'extra')),
  constraint manual_credit_grants_amount_check
    check (amount between 1 and 100),
  constraint manual_credit_grants_reason_check
    check (reason in (
      'mentorship_bonus',
      'administrative_adjustment',
      'technical_issue_compensation',
      'credit_replacement',
      'courtesy',
      'promotional_campaign',
      'other'
    )),
  constraint manual_credit_grants_mentorship_reason_check
    check (reason <> 'mentorship_bonus' or credit_type = 'mentorship'),
  constraint manual_credit_grants_internal_note_check
    check (
      (reason not in ('administrative_adjustment', 'other'))
      or (internal_note is not null and length(btrim(internal_note)) between 1 and 1000)
    ),
  constraint manual_credit_grants_internal_note_length_check
    check (internal_note is null or length(internal_note) <= 1000),
  constraint manual_credit_grants_expiration_check
    check (
      (credit_type = 'extra' and expires_at is null)
      or (credit_type in ('mentorship', 'plan') and expires_at is not null)
    ),
  constraint manual_credit_grants_links_check
    check (
      (credit_type = 'mentorship' and subscription_id is not null and mentorship_allocation_id is not null)
      or (credit_type = 'plan' and subscription_id is not null and mentorship_allocation_id is null)
      or (credit_type = 'extra' and subscription_id is null and mentorship_allocation_id is null)
    )
);

create index manual_credit_grants_student_created_idx
  on public.manual_credit_grants (student_id, created_at desc);

create index manual_credit_grants_administrator_created_idx
  on public.manual_credit_grants (administrator_id, created_at desc);

alter table public.manual_credit_grants enable row level security;
revoke all on table public.manual_credit_grants from public, anon, authenticated;
grant select on table public.manual_credit_grants to authenticated;
grant all privileges on table public.manual_credit_grants to service_role;

create policy "Admins read manual credit grants"
  on public.manual_credit_grants
  for select
  to authenticated
  using (public.get_my_role() = 'ADMIN');

create function public.grant_manual_credits(
  p_operation_id uuid,
  p_student_id uuid,
  p_credit_type text,
  p_amount integer,
  p_reason text,
  p_internal_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_administrator_id uuid := auth.uid();
  v_credit_type text := lower(btrim(coalesce(p_credit_type, '')));
  v_reason text := lower(btrim(coalesce(p_reason, '')));
  v_internal_note text := nullif(btrim(coalesce(p_internal_note, '')), '');
  v_existing public.manual_credit_grants%rowtype;
  v_profile_role public.app_role;
  v_profile_status text;
  v_subscription_id uuid;
  v_subscription_status public.subscription_status;
  v_subscription_period_end timestamptz;
  v_subscription_withdrawal_status text;
  v_plan_external_id text;
  v_plan_price integer;
  v_mentorship_allocation_id uuid;
  v_expires_at timestamptz;
  v_transaction_id uuid;
  v_reason_label text;
  v_description text;
  v_metadata jsonb;
begin
  if v_administrator_id is null
    or public.get_my_role() is distinct from 'ADMIN'
  then
    raise exception 'Acesso não autorizado.';
  end if;

  if p_operation_id is null or p_student_id is null then
    raise exception 'Operação e aluno são obrigatórios.';
  end if;

  perform pg_advisory_xact_lock(pg_catalog.hashtextextended(p_student_id::text, 0));

  select grant_record.*
  into v_existing
  from public.manual_credit_grants as grant_record
  where grant_record.id = p_operation_id;

  if found then
    if v_existing.student_id is distinct from p_student_id
      or v_existing.administrator_id is distinct from v_administrator_id
      or v_existing.credit_type is distinct from v_credit_type
      or v_existing.amount is distinct from p_amount
      or v_existing.reason is distinct from v_reason
      or v_existing.internal_note is distinct from v_internal_note
    then
      raise exception 'Operação já utilizada com dados diferentes.';
    end if;

    return jsonb_build_object(
      'id', v_existing.id,
      'credit_type', v_existing.credit_type,
      'amount', v_existing.amount,
      'expires_at', v_existing.expires_at,
      'created_at', v_existing.created_at,
      'replayed', true
    );
  end if;

  if v_credit_type not in ('mentorship', 'plan', 'extra') then
    raise exception 'Tipo de crédito inválido.';
  end if;

  if p_amount is null or p_amount < 1 or p_amount > 100 then
    raise exception 'A quantidade deve estar entre 1 e 100 créditos.';
  end if;

  if v_reason not in (
    'mentorship_bonus',
    'administrative_adjustment',
    'technical_issue_compensation',
    'credit_replacement',
    'courtesy',
    'promotional_campaign',
    'other'
  ) then
    raise exception 'Motivo inválido.';
  end if;

  if v_reason = 'mentorship_bonus' and v_credit_type <> 'mentorship' then
    raise exception 'Bônus da mentoria só pode ser usado em créditos de mentoria.';
  end if;

  if v_reason in ('administrative_adjustment', 'other') and v_internal_note is null then
    raise exception 'A observação interna é obrigatória para o motivo selecionado.';
  end if;

  if v_internal_note is not null and length(v_internal_note) > 1000 then
    raise exception 'A observação interna deve ter no máximo 1000 caracteres.';
  end if;

  select profile.role, profile.status
  into v_profile_role, v_profile_status
  from public.profiles as profile
  where profile.id = p_student_id
  for update;

  if not found or v_profile_role is distinct from 'STUDENT' then
    raise exception 'Aluno não encontrado.';
  end if;

  if v_profile_status = 'blocked' then
    raise exception 'Não é possível conceder créditos a uma conta bloqueada.';
  end if;

  v_reason_label := case v_reason
    when 'mentorship_bonus' then 'Bônus da mentoria'
    when 'administrative_adjustment' then 'Ajuste administrativo'
    when 'technical_issue_compensation' then 'Compensação por problema técnico'
    when 'credit_replacement' then 'Reposição de créditos'
    when 'courtesy' then 'Cortesia'
    when 'promotional_campaign' then 'Campanha promocional'
    when 'other' then 'Outro motivo'
  end;

  if v_credit_type = 'mentorship' then
    select
      allocation.id,
      allocation.subscription_id,
      allocation.expires_at
    into
      v_mentorship_allocation_id,
      v_subscription_id,
      v_expires_at
    from public.mentorship_credit_allocations as allocation
    where allocation.user_id = p_student_id
      and allocation.status in ('active', 'consumed')
      and allocation.available_at <= now()
      and allocation.expires_at > now()
    order by allocation.expires_at asc, allocation.cycle_number asc
    limit 1
    for update;

    if not found then
      raise exception 'O aluno não possui um ciclo vigente de mentoria.';
    end if;

    update public.mentorship_credit_allocations
    set
      remaining_amount = remaining_amount + p_amount,
      administrative_grants = administrative_grants + p_amount,
      status = 'active',
      updated_at = now()
    where id = v_mentorship_allocation_id;

  elsif v_credit_type = 'plan' then
    select
      subscription.id,
      subscription.status,
      subscription.current_period_end,
      subscription.withdrawal_status,
      plan.external_id,
      plan.price
    into
      v_subscription_id,
      v_subscription_status,
      v_subscription_period_end,
      v_subscription_withdrawal_status,
      v_plan_external_id,
      v_plan_price
    from public.subscriptions as subscription
    join public.plans as plan on plan.id = subscription.plan_id
    where subscription.user_id = p_student_id
    for update of subscription;

    if not found
      or v_subscription_status not in ('active', 'trial')
      or v_subscription_period_end is null
      or public.subscription_access_end(v_subscription_period_end) <= now()
      or coalesce(v_plan_price, 0) <= 0
      or v_plan_external_id in ('internal_free_trial', 'internal_mentoria_free')
    then
      raise exception 'O aluno não possui um ciclo vigente de plano pago.';
    end if;

    if v_subscription_withdrawal_status is not null
      or exists (
        select 1
        from public.subscription_support_operations as operation
        where operation.student_id = p_student_id
          and operation.status <> 'completed'
      )
    then
      raise exception 'O plano possui um atendimento em andamento.';
    end if;

    v_expires_at := public.subscription_access_end(v_subscription_period_end);
  end if;

  v_description := format(
    'Adição manual de %s crédito(s) de %s. Motivo: %s.',
    p_amount,
    case v_credit_type
      when 'mentorship' then 'mentoria'
      when 'plan' then 'plano'
      else 'tipo extra'
    end,
    v_reason_label
  );

  v_metadata := jsonb_build_object(
    'source', 'manual_credit_grant',
    'manual_credit_grant_id', p_operation_id,
    'credit_type', case when v_credit_type = 'mentorship' then 'plan' else v_credit_type end,
    'grant_category', v_credit_type,
    'reason', v_reason,
    'reason_label', v_reason_label,
    'expires_at', v_expires_at,
    'subscription_id', v_subscription_id,
    'mentorship_allocation_id', v_mentorship_allocation_id
  );

  if v_credit_type = 'mentorship' then
    v_metadata := v_metadata || jsonb_build_object('plan_source', 'mentorship');
  end if;

  insert into public.credit_transactions (
    user_id,
    type,
    amount,
    description,
    metadata
  ) values (
    p_student_id,
    'administrative_adjustment',
    p_amount,
    v_description,
    jsonb_strip_nulls(v_metadata)
  )
  returning id into v_transaction_id;

  insert into public.manual_credit_grants (
    id,
    student_id,
    administrator_id,
    credit_type,
    amount,
    reason,
    internal_note,
    expires_at,
    subscription_id,
    mentorship_allocation_id,
    credit_transaction_id
  ) values (
    p_operation_id,
    p_student_id,
    v_administrator_id,
    v_credit_type,
    p_amount,
    v_reason,
    v_internal_note,
    v_expires_at,
    v_subscription_id,
    v_mentorship_allocation_id,
    v_transaction_id
  );

  return jsonb_build_object(
    'id', p_operation_id,
    'credit_type', v_credit_type,
    'amount', p_amount,
    'expires_at', v_expires_at,
    'created_at', now(),
    'replayed', false
  );
end;
$$;

revoke all on function public.grant_manual_credits(uuid, uuid, text, integer, text, text)
  from public, anon, authenticated;
grant execute on function public.grant_manual_credits(uuid, uuid, text, integer, text, text)
  to authenticated;

commit;
