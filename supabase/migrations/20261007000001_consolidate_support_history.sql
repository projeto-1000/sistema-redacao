-- One visible support attendance per operation, before filtering/counting/pagination.
-- Audit transactions and credit balances are preserved. Authorization is unchanged.
-- Rollback: restore get_subscription_history_events from 20260805000001_initial_schema.sql.
CREATE OR REPLACE FUNCTION public.get_subscription_history_events(p_user_id uuid DEFAULT NULL::uuid, p_page integer DEFAULT 1, p_limit integer DEFAULT 10, p_transaction_type text DEFAULT NULL::text, p_from timestamp with time zone DEFAULT NULL::timestamp with time zone, p_to timestamp with time zone DEFAULT NULL::timestamp with time zone) RETURNS TABLE(kind text, id uuid, user_id uuid, created_at timestamp with time zone, transaction_type text, credit_amount integer, description text, student_payment_id uuid, paid_at timestamp with time zone, amount_in_cents integer, credits_amount integer, payment_status text, payment_method text, plan_id uuid, plan_name text, subscription_id uuid, metadata jsonb, total_count bigint)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$declare
  v_requester_id uuid;
  v_requester_role text;
  v_target_user_id uuid;
  v_requester_is_admin boolean := false;

  v_page integer;
  v_limit integer;
  v_offset integer;
begin
  v_requester_id := auth.uid();

  v_requester_role :=
    coalesce(
      auth.jwt() ->> 'role',
      ''
    );

  if v_requester_id is not null then
  select exists (
    select 1
    from public.profiles profile
    where profile.id = v_requester_id
      and profile.role = 'ADMIN'
  )
  into v_requester_is_admin;
end if;

  v_target_user_id :=
    coalesce(
      p_user_id,
      v_requester_id
    );

  if v_target_user_id is null then
    raise exception
      'Usuário não informado.';
  end if;


  if
  v_requester_role <> 'service_role'
  and not v_requester_is_admin
  and v_requester_id is distinct from v_target_user_id
then
  raise exception
    'Acesso não autorizado.';
end if;

  v_page :=
    greatest(
      coalesce(p_page, 1),
      1
    );

  v_limit :=
    least(
      greatest(
        coalesce(p_limit, 10),
        1
      ),
      100
    );

  v_offset :=
    (v_page - 1) * v_limit;

  return query
  with ranked_credit_events as (
    select ct.*,
      row_number() over (
        partition by case
          when ct.type::text = 'administrative_adjustment'
            and ct.metadata ->> 'source' = 'admin_support'
            and nullif(ct.metadata ->> 'support_operation_id', '') is not null
          then 'support:' || (ct.metadata ->> 'support_operation_id')
          else 'transaction:' || ct.id::text
        end
        order by (ct.metadata ? 'refund_amount') desc, ct.created_at desc, ct.id desc
      ) as display_rank,
      min(ct.created_at) over (
        partition by case
          when ct.type::text = 'administrative_adjustment'
            and ct.metadata ->> 'source' = 'admin_support'
            and nullif(ct.metadata ->> 'support_operation_id', '') is not null
          then 'support:' || (ct.metadata ->> 'support_operation_id')
          else 'transaction:' || ct.id::text
        end
      ) as started_at
    from public.credit_transactions ct
    where ct.user_id = v_target_user_id
  ),
  history_events as (
    /*
     * ---------------------------------------------
     * MOVIMENTAÇÕES DE CRÉDITOS
     * ---------------------------------------------
     */
    select
      'credit_transaction'::text as kind,

      ct.id,
      ct.user_id,
      ct.created_at,

      ct.type::text as transaction_type,
      ct.amount as credit_amount,
      ct.description,
      ct.student_payment_id,

      null::timestamptz as paid_at,
      null::integer as amount_in_cents,
      null::integer as credits_amount,
      null::text as payment_status,
      null::text as payment_method,

      null::uuid as plan_id,
      null::text as plan_name,
      null::uuid as subscription_id,

      case when ct.metadata ->> 'source' = 'admin_support'
        and nullif(ct.metadata ->> 'support_operation_id', '') is not null
      then ct.metadata || jsonb_build_object(
        'support_started_at', ct.started_at,
        'support_completed_at', case when ct.metadata ? 'refund_amount' then ct.created_at else null end
      )
      else ct.metadata end as metadata,

      /*
       * Transações vinculadas a um pagamento usam
       * a data do pagamento como agrupamento.
       */
      coalesce(
        payment.paid_at,
        payment.created_at,
        ct.created_at
      ) as sort_at,

      /*
       * Dentro do mesmo pagamento:
       * cobrança primeiro, créditos depois.
       */
      0 as sort_priority

    from ranked_credit_events ct

    left join public.student_payments payment
      on payment.id = ct.student_payment_id

    where ct.display_rank = 1

      and (
        p_transaction_type is null
        or ct.type::text = p_transaction_type
      )

      and (
        p_from is null
        or ct.created_at >= p_from
      )

      and (
        p_to is null
        or ct.created_at <= p_to
      )

    union all

    /*
     * ---------------------------------------------
     * COBRANÇAS
     * ---------------------------------------------
     */
    select
      'payment'::text as kind,

      payment.id,
      payment.user_id,

      coalesce(
        payment.paid_at,
        payment.created_at
      ) as created_at,

      null::text as transaction_type,
      null::integer as credit_amount,
      null::text as description,
      null::uuid as student_payment_id,

      payment.paid_at,
      payment.amount as amount_in_cents,
      payment.credits_amount,
      payment.status as payment_status,
      payment.payment_method,

      payment.plan_id,
      plan.name as plan_name,
      payment.subscription_id,

      payment.metadata,

      coalesce(
        payment.paid_at,
        payment.created_at
      ) as sort_at,
      
      1 as sort_prioritys

    from public.student_payments payment

    left join public.plans plan
      on plan.id = payment.plan_id

    where payment.user_id = v_target_user_id

      /*
       * O filtro atual é de tipo de movimentação
       * de crédito. Quando usado, cobranças não
       * entram no resultado.
       */
      and p_transaction_type is null

      and (
        p_from is null
        or coalesce(
          payment.paid_at,
          payment.created_at
        ) >= p_from
      )

      and (
        p_to is null
        or coalesce(
          payment.paid_at,
          payment.created_at
        ) <= p_to
      )
  ),

  counted_events as (
    select
      history_events.*,
      count(*) over () as total_count
    from history_events
  )

  select
    counted_events.kind,
    counted_events.id,
    counted_events.user_id,
    counted_events.created_at,

    counted_events.transaction_type,
    counted_events.credit_amount,
    counted_events.description,
    counted_events.student_payment_id,

    counted_events.paid_at,
    counted_events.amount_in_cents,
    counted_events.credits_amount,
    counted_events.payment_status,
    counted_events.payment_method,

    counted_events.plan_id,
    counted_events.plan_name,
    counted_events.subscription_id,

    counted_events.metadata,
    counted_events.total_count

  from counted_events

  order by
    counted_events.sort_at desc,
    counted_events.sort_priority asc,
    counted_events.created_at asc

  offset v_offset
  limit v_limit;
end;$$;


