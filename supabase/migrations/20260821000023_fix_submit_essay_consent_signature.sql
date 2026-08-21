begin;

drop function if exists public.submit_essay(uuid, uuid, text, text, text, boolean);
drop function if exists public.submit_essay(uuid, uuid, text, text, text);

create function public.submit_essay(
    p_student_id uuid,
    p_topic_id uuid,
    p_title text,
    p_thematic_axis text,
    p_content text,
    p_best_essay_consent boolean default false
)
returns uuid
language plpgsql
security definer
set search_path = 'public'
as $$
declare
  v_authenticated_user_id uuid;

  v_calculated_due_date timestamptz;
  v_essay_id uuid;

  v_free_credits integer := 0;
  v_plan_credits integer := 0;
  v_extra_credits integer := 0;

  v_used_credit_type text;
  v_transaction_metadata jsonb;

  v_free_allocation_id uuid;

  v_mentorship_allocation_id uuid;
  v_mentorship_cycle_number smallint;
begin
  /*
   * 1. Segurança
   */
  v_authenticated_user_id := auth.uid();

  if v_authenticated_user_id is null then
    raise exception 'Usuário não autenticado.';
  end if;

  if v_authenticated_user_id <> p_student_id then
    raise exception
      'Você não tem permissão para enviar uma redação para outro aluno.';
  end if;

  /*
   * 2. Trava o saldo do aluno.
   */
  select
    free_credits,
    plan_credits,
    extra_credits
  into
    v_free_credits,
    v_plan_credits,
    v_extra_credits
  from public.student_credits
  where user_id = p_student_id
  for update;

  if not found then
    raise exception
      'Saldo de créditos insuficiente para enviar a redação.';
  end if;

  /*
   * 3. Procura um crédito gratuito ativo e válido.
   */
  select allocation.id
  into v_free_allocation_id
  from public.free_credit_allocations as allocation
  where allocation.user_id = p_student_id
    and allocation.status = 'active'
    and allocation.remaining_amount > 0
    and allocation.granted_at <= now()
    and allocation.expires_at > now()
  order by allocation.expires_at asc
  limit 1
  for update;

  /*
   * 4. Procura um lote ativo da Mentoria somente
   * quando não existe crédito gratuito disponível.
   */
  if v_free_allocation_id is null then
    select
      allocation.id,
      allocation.cycle_number
    into
      v_mentorship_allocation_id,
      v_mentorship_cycle_number
    from public.mentorship_credit_allocations as allocation
    where allocation.user_id = p_student_id
      and allocation.status = 'active'
      and allocation.remaining_amount > 0
      and allocation.available_at <= now()
      and allocation.expires_at > now()
    order by
      allocation.expires_at asc,
      allocation.cycle_number asc
    limit 1
    for update;
  end if;

  /*
   * 5. Define a origem do crédito.
   */
  if v_free_allocation_id is not null then
    if coalesce(v_free_credits, 0) <= 0 then
      raise exception
        'Inconsistência no saldo do crédito gratuito.';
    end if;

    v_used_credit_type := 'free';

  elsif v_mentorship_allocation_id is not null then
    if coalesce(v_plan_credits, 0) <= 0 then
      raise exception
        'Inconsistência no saldo dos créditos da mentoria.';
    end if;

    v_used_credit_type := 'plan';

  elsif coalesce(v_plan_credits, 0) > 0 then
    v_used_credit_type := 'plan';

  elsif coalesce(v_extra_credits, 0) > 0 then
    v_used_credit_type := 'extra';

  else
    raise exception
      'Saldo de créditos insuficiente para enviar a redação.';
  end if;

  /*
   * 6. Calcula o prazo da correção.
   */
  v_calculated_due_date :=
    calculate_essay_due_date(
      now() at time zone 'America/Sao_Paulo'
    );

  /*
   * 7. Cria a redação.
   */
  insert into public.essays (
    student_id,
    topic_id,
    title,
    thematic_axis,
    content,
    best_essay_consent,
    status,
    due_date
  )
  values (
    p_student_id,
    p_topic_id,
    p_title,
    p_thematic_axis,
    p_content,
    coalesce(p_best_essay_consent, false),
    'pending',
    v_calculated_due_date
  )
  returning id into v_essay_id;

  /*
   * 8. Desconta da alocação gratuita.
   */
  if v_free_allocation_id is not null then
    update public.free_credit_allocations
    set
      remaining_amount = remaining_amount - 1,

      status = case
        when remaining_amount - 1 = 0
          then 'consumed'
        else 'active'
      end,

      updated_at = now()
    where id = v_free_allocation_id
      and remaining_amount > 0
      and status = 'active'
      and expires_at > now();

    if not found then
      raise exception
        'Não foi possível consumir o crédito gratuito.';
    end if;
  end if;

  /*
   * 9. Desconta do lote da Mentoria.
   */
  if v_mentorship_allocation_id is not null then
    update public.mentorship_credit_allocations
    set
      remaining_amount = remaining_amount - 1,

      status = case
        when remaining_amount - 1 = 0
          then 'consumed'
        else 'active'
      end,

      updated_at = now()
    where id = v_mentorship_allocation_id
      and remaining_amount > 0;

    if not found then
      raise exception
        'Não foi possível consumir o crédito da mentoria.';
    end if;
  end if;

  /*
   * 10. Prepara os metadados da movimentação.
   */
  v_transaction_metadata :=
    jsonb_build_object(
      'essay_id',
      v_essay_id,

      'title',
      p_title,

      'credit_type',
      v_used_credit_type
    );

  if v_free_allocation_id is not null then
    v_transaction_metadata :=
      v_transaction_metadata ||
      jsonb_build_object(
        'credit_source',
        'free_trial',

        'free_credit_allocation_id',
        v_free_allocation_id
      );
  end if;

  if v_mentorship_allocation_id is not null then
    v_transaction_metadata :=
      v_transaction_metadata ||
      jsonb_build_object(
        'plan_source',
        'mentorship',

        'mentorship_allocation_id',
        v_mentorship_allocation_id,

        'mentorship_cycle_number',
        v_mentorship_cycle_number
      );
  end if;

  /*
   * 11. Registra o consumo.
   *
   * A trigger recalcula student_credits.
   */
  insert into public.credit_transactions (
    user_id,
    type,
    amount,
    description,
    metadata
  )
  values (
    p_student_id,
    'essay_usage',
    -1,
    'Envio de redação',
    v_transaction_metadata
  );

  return v_essay_id;
end;
$$;

revoke all on function public.submit_essay(uuid, uuid, text, text, text, boolean)
from public, anon, authenticated;

grant execute on function public.submit_essay(uuid, uuid, text, text, text, boolean)
to authenticated, service_role;

notify pgrst, 'reload schema';

commit;
