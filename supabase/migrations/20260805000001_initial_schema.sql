-- Baseline generated from the verified development schema backup.
-- It intentionally contains no application or authentication data.

--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: app_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.app_role AS ENUM (
    'STUDENT',
    'TEACHER',
    'ADMIN'
);


--
-- Name: billing_cycle; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.billing_cycle AS ENUM (
    'monthly',
    'quarterly',
    'yearly',
    'lifetime'
);


--
-- Name: plan_tier; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.plan_tier AS ENUM (
    'basic',
    'premium',
    'none'
);


--
-- Name: subscription_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.subscription_status AS ENUM (
    'active',
    'past_due',
    'canceled',
    'unpaid',
    'trial'
);


--
-- Name: thematic_axis; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.thematic_axis AS ENUM (
    'Meio Ambiente',
    'Questões Sociais',
    'Saúde',
    'Cultura',
    'Direitos e Cidadania',
    'Educação',
    'Tecnologia',
    'Economia'
);


--
-- Name: thematic_axis_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.thematic_axis_enum AS ENUM (
    'Educação',
    'Meio Ambiente',
    'Cidadania e Direitos Humanos',
    'Saúde',
    'Cultura',
    'Tecnologia',
    'Trabalho',
    'Segurança'
);


--
-- Name: topic_origin_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.topic_origin_enum AS ENUM (
    'ENEM',
    'AUTORAL'
);


--
-- Name: transaction_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.transaction_type AS ENUM (
    'plan_renewal',
    'standalone_purchase',
    'essay_usage',
    'plan_change',
    'administrative_adjustment',
    'new_subscription',
    'mentorship_bonus',
    'essay_refund',
    'mentorship_expiration',
    'free_trial_grant',
    'subscription_reactivation',
    'plan_expiration',
    'free_credit_expiration'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: essay_topics; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.essay_topics (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    axis public.thematic_axis NOT NULL,
    source_type text DEFAULT 'AUTORAL'::text,
    source_year integer,
    active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    CONSTRAINT essay_topics_source_type_check CHECK ((source_type = ANY (ARRAY['ENEM'::text, 'ENEM PPL'::text, 'AUTORAL'::text])))
);


--
-- Name: axis_text(public.essay_topics); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.axis_text(public.essay_topics) RETURNS text
    LANGUAGE sql IMMUTABLE
    AS $_$
  SELECT $1.axis::text;
$_$;


--
-- Name: calculate_essay_due_date(timestamp with time zone); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.calculate_essay_due_date(p_start_date timestamp with time zone) RETURNS timestamp with time zone
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_due_date TIMESTAMP WITH TIME ZONE := p_start_date;
BEGIN
    -- PASSO 1: Ajuste de entrada (O "limbo")
    -- Se o aluno enviar no fim de semana ou feriado, o prazo só começa no próximo dia útil às 00:00:00
    WHILE 
        EXTRACT(DOW FROM v_due_date) IN (0, 6) OR 
        EXISTS (SELECT 1 FROM public.holidays WHERE date = v_due_date::date)
    LOOP
        v_due_date := (date_trunc('day', v_due_date) + INTERVAL '1 day');
    END LOOP;

    -- PASSO 2: Adicionar as 24h úteis (1 dia útil)
    -- Somamos 1 dia inicial
    v_due_date := v_due_date + INTERVAL '1 day';

    -- PASSO 3: Ajuste de saída
    -- Se a data final cair em fim de semana ou feriado, pula para o próximo dia útil
    -- Mantendo o horário original (ou o 00:00 caso tenha vindo do limbo)
    WHILE 
        EXTRACT(DOW FROM v_due_date) IN (0, 6) OR 
        EXISTS (SELECT 1 FROM public.holidays WHERE date = v_due_date::date)
    LOOP
        v_due_date := v_due_date + INTERVAL '1 day';
    END LOOP;

    RETURN v_due_date;
END;
$$;


--
-- Name: check_document_exists(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.check_document_exists(doc_to_check text) RETURNS boolean
    LANGUAGE sql SECURITY DEFINER
    AS $$SELECT EXISTS (
  SELECT 1 FROM public.profiles WHERE document = doc_to_check
);$$;


--
-- Name: complete_student_onboarding(text, text, text, text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.complete_student_onboarding(p_education_level text, p_school_type text, p_desired_course text, p_state text, p_city text) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare
  v_user_id uuid;
  v_acquisition_channel text;

  v_has_active_free_credit boolean := false;
  v_free_credit_expires_at timestamptz;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'Usuário não autenticado.';
  end if;

  select profile.acquisition_channel
  into v_acquisition_channel
  from public.profiles as profile
  where profile.id = v_user_id
    and profile.role = 'STUDENT';

  if not found then
    raise exception 'Perfil de aluno não encontrado.';
  end if;

  insert into public.student_details (
    id,
    education_level,
    school_type,
    desired_course,
    state,
    city,
    updated_at
  )
  values (
    v_user_id,
    p_education_level,
    p_school_type,
    p_desired_course,
    p_state,
    p_city,
    now()
  )
  on conflict (id)
  do update set
    education_level = excluded.education_level,
    school_type = excluded.school_type,
    desired_course = excluded.desired_course,
    state = excluded.state,
    city = excluded.city,
    updated_at = now();

  update public.profiles
  set onboarding_completed = true
  where id = v_user_id
    and role = 'STUDENT';

  if not found then
    raise exception
      'Não foi possível concluir o onboarding do aluno.';
  end if;

  select allocation.expires_at
  into v_free_credit_expires_at
  from public.free_credit_allocations as allocation
  where allocation.user_id = v_user_id
    and allocation.status = 'active'
    and allocation.remaining_amount > 0
    and allocation.granted_at <= now()
    and allocation.expires_at > now()
  order by allocation.expires_at asc
  limit 1;

  v_has_active_free_credit := found;

  return jsonb_build_object(
    'acquisitionChannel',
    v_acquisition_channel,
    'hasActiveFreeCredit',
    v_has_active_free_credit,
    'freeCreditExpiresAt',
    case
      when v_has_active_free_credit
        then v_free_credit_expires_at
      else null
    end
  );
end;
$$;


--
-- Name: finalize_plan_upgrade(uuid, uuid, uuid, uuid, uuid, integer, integer, text, text, text, timestamp with time zone, text, timestamp with time zone, timestamp with time zone); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.finalize_plan_upgrade(p_user_id uuid, p_subscription_id uuid, p_payment_id uuid, p_expected_current_plan_id uuid, p_target_plan_id uuid, p_prorated_amount integer, p_additional_credits integer, p_order_external_id text, p_order_status text, p_charge_external_id text, p_paid_at timestamp with time zone, p_subscription_item_external_id text, p_current_period_start timestamp with time zone, p_current_period_end timestamp with time zone) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare
  v_subscription public.subscriptions%rowtype;
  v_payment public.student_payments%rowtype;

  v_current_plan_name text;
  v_target_plan_name text;

  v_credit_transaction_id uuid;
begin
  if p_user_id is null then
    raise exception 'O usuário é obrigatório.';
  end if;

  if p_prorated_amount <= 0 then
    raise exception 'O valor proporcional precisa ser positivo.';
  end if;

  if p_additional_credits <= 0 then
    raise exception 'A quantidade adicional de créditos precisa ser positiva.';
  end if;

  if p_order_external_id is null
    or btrim(p_order_external_id) = ''
  then
    raise exception 'O pedido da Pagar.me é obrigatório.';
  end if;

  /*
   * Bloqueia a assinatura durante a finalização.
   */
  select subscription.*
  into v_subscription
  from public.subscriptions as subscription
  where subscription.id = p_subscription_id
    and subscription.user_id = p_user_id
  for update;

  if not found then
    raise exception 'Assinatura não encontrada.';
  end if;

  /*
   * Bloqueia o pagamento reservado para esta operação.
   */
  select payment.*
  into v_payment
  from public.student_payments as payment
  where payment.id = p_payment_id
    and payment.user_id = p_user_id
    and payment.subscription_id = p_subscription_id
    and payment.plan_id = p_target_plan_id
    and payment.kind = 'plan_upgrade_prorata'
  for update;

  if not found then
    raise exception 'Pagamento do upgrade não encontrado.';
  end if;

  /*
   * Retorno idempotente quando a operação já foi concluída.
   */
  if v_subscription.plan_id = p_target_plan_id
    and v_payment.status in (
      'paid',
      'active'
    )
  then
    select transaction.id
    into v_credit_transaction_id
    from public.credit_transactions as transaction
    where transaction.student_payment_id = p_payment_id
      and transaction.type::text = 'plan_change'
    limit 1;

    return jsonb_build_object(
      'success',
      true,

      'already_processed',
      true,

      'subscription_id',
      p_subscription_id,

      'payment_id',
      p_payment_id,

      'credit_transaction_id',
      v_credit_transaction_id
    );
  end if;

  if v_subscription.plan_id
    <> p_expected_current_plan_id
  then
    raise exception 'O plano atual da assinatura foi alterado durante a operação.';
  end if;

  if v_subscription.status::text not in (
    'active',
    'trial'
  ) then
    raise exception 'A assinatura atual não permite upgrade.';
  end if;

  if coalesce(
    v_subscription.cancel_at_period_end,
    false
  ) then
    raise exception 'A assinatura possui cancelamento agendado.';
  end if;

  if v_payment.amount
    <> p_prorated_amount
  then
    raise exception 'O valor do pagamento não corresponde ao cálculo do upgrade.';
  end if;

  if v_payment.credits_amount
    <> p_additional_credits
  then
    raise exception 'Os créditos do pagamento não correspondem ao upgrade.';
  end if;

  if v_payment.external_id is not null
    and v_payment.external_id
      <> p_order_external_id
  then
    raise exception 'O pagamento já está vinculado a outro pedido.';
  end if;

  select plan.name
  into v_current_plan_name
  from public.plans as plan
  where plan.id =
    p_expected_current_plan_id;

  select plan.name
  into v_target_plan_name
  from public.plans as plan
  where plan.id =
    p_target_plan_id;

  if v_target_plan_name is null then
    raise exception 'O plano de destino não foi encontrado.';
  end if;

  /*
   * Registra o pagamento aprovado.
   */
  update public.student_payments
  set
    external_id = p_order_external_id,
    status = 'paid',
    paid_at = coalesce(
      p_paid_at,
      now()
    ),
    metadata =
      coalesce(metadata, '{}'::jsonb) ||
      jsonb_build_object(
        'provider',
        'pagarme',

        'pagarme_order_id',
        p_order_external_id,

        'pagarme_order_status',
        p_order_status,

        'pagarme_charge_id',
        p_charge_external_id,

        'upgrade_finalized_at',
        now(),

        'previous_plan_id',
        p_expected_current_plan_id,

        'target_plan_id',
        p_target_plan_id,

        'subscription_item_external_id',
        p_subscription_item_external_id,

        'current_period_start',
        p_current_period_start,

        'current_period_end',
        p_current_period_end
      ),
    updated_at = now()
  where id = p_payment_id;

  /*
   * Altera o plano local sem modificar o ciclo atual.
   */
  update public.subscriptions
  set
    plan_id = p_target_plan_id,

    metadata =
      coalesce(metadata, '{}'::jsonb) ||
      jsonb_build_object(
        'previous_plan_id',
        p_expected_current_plan_id,

        'previous_plan_name',
        v_current_plan_name,

        'current_plan_id',
        p_target_plan_id,

        'current_plan_name',
        v_target_plan_name,

        'last_plan_upgrade_payment_id',
        p_payment_id,

        'last_plan_upgrade_order_id',
        p_order_external_id,

        'pagarme_subscription_item_id',
        p_subscription_item_external_id,

        'last_plan_upgrade_at',
        now()
      ),

    updated_at = now()
  where id = p_subscription_id;

  /*
   * Libera somente a diferença de créditos.
   */
  insert into public.credit_transactions (
    user_id,
    type,
    amount,
    description,
    student_payment_id,
    metadata
  )
  values (
    p_user_id,
    'plan_change',
    p_additional_credits,

    format(
      'Liberação de %s crédito(s) pelo upgrade do plano %s para o plano %s.',
      p_additional_credits,
      coalesce(
        v_current_plan_name,
        'anterior'
      ),
      v_target_plan_name
    ),

    p_payment_id,

    jsonb_build_object(
      'source',
      'plan_upgrade',

      'credit_type',
      'plan',

      'grant_type',
      'plan_upgrade_difference',

      'subscription_id',
      p_subscription_id,

      'previous_plan_id',
      p_expected_current_plan_id,

      'previous_plan_name',
      v_current_plan_name,

      'target_plan_id',
      p_target_plan_id,

      'target_plan_name',
      v_target_plan_name,

      'additional_credits',
      p_additional_credits,

      'prorated_amount',
      p_prorated_amount,

      'pagarme_order_id',
      p_order_external_id,

      'pagarme_charge_id',
      p_charge_external_id,

      'current_period_start',
      p_current_period_start,

      'current_period_end',
      p_current_period_end
    )
  )
  on conflict (
    student_payment_id,
    type
  )
  where student_payment_id is not null
  do nothing
  returning id
  into v_credit_transaction_id;

  if v_credit_transaction_id is null then
    select transaction.id
    into v_credit_transaction_id
    from public.credit_transactions as transaction
    where transaction.student_payment_id =
      p_payment_id
      and transaction.type::text =
        'plan_change'
    limit 1;
  end if;

  return jsonb_build_object(
    'success',
    true,

    'already_processed',
    false,

    'subscription_id',
    p_subscription_id,

    'payment_id',
    p_payment_id,

    'credit_transaction_id',
    v_credit_transaction_id,

    'previous_plan_id',
    p_expected_current_plan_id,

    'target_plan_id',
    p_target_plan_id,

    'additional_credits',
    p_additional_credits
  );
end;
$$;


--
-- Name: get_current_student_credit_summary(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_current_student_credit_summary() RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare
  v_user_id uuid;

  v_plan_credits integer := 0;
  v_extra_credits integer := 0;
  v_free_credits integer := 0;
  v_mentorship_credits integer := 0;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'Usuário não autenticado.';
  end if;

  if not exists (
    select 1
    from public.profiles as profile
    where profile.id = v_user_id
      and profile.role = 'STUDENT'
  ) then
    raise exception 'Perfil de aluno não encontrado.';
  end if;

  /*
   * Recupera os saldos consolidados da carteira.
   */
  select
    coalesce(credits.plan_credits, 0),
    coalesce(credits.extra_credits, 0),
    coalesce(credits.free_credits, 0)
  into
    v_plan_credits,
    v_extra_credits,
    v_free_credits
  from public.student_credits as credits
  where credits.user_id = v_user_id;

  /*
   * Caso ainda não exista uma carteira, mantém
   * todos os saldos em zero.
   */
  v_plan_credits :=
    coalesce(v_plan_credits, 0);

  v_extra_credits :=
    coalesce(v_extra_credits, 0);

  v_free_credits :=
    coalesce(v_free_credits, 0);

  /*
   * Soma apenas os créditos da Mentoria que estejam
   * realmente disponíveis neste momento.
   */
  select coalesce(
    sum(allocation.remaining_amount),
    0
  )::integer
  into v_mentorship_credits
  from public.mentorship_credit_allocations
    as allocation
  where allocation.user_id = v_user_id
    and allocation.status = 'active'
    and allocation.remaining_amount > 0
    and allocation.available_at <= now()
    and allocation.expires_at > now();

  return jsonb_build_object(
    'total',
      v_plan_credits
      + v_extra_credits
      + v_free_credits
      + v_mentorship_credits,

    'plan',
      v_plan_credits,

    'extra',
      v_extra_credits,

    'free',
      v_free_credits,

    'mentorship',
      v_mentorship_credits
  );
end;
$$;


--
-- Name: get_dashboard_metrics(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_dashboard_metrics() RETURNS json
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  current_month_start timestamptz := date_trunc('month', now());
  last_month_start timestamptz := current_month_start - interval '1 month';
  
  p_current int;
  p_last int;
  
  e_pending int;
  e_current int;
  e_last int;
  
  s_current int;
  s_last int;
BEGIN
  -- ALUNOS ATIVOS: Contagem de CPFs únicos (p.id) com plano 'active'. 
  -- Ignora 'trial' e ignorar cancelados com saldo.
  SELECT 
    count(DISTINCT p.id),
    count(DISTINCT p.id) FILTER (WHERE s.created_at < current_month_start)
  INTO p_current, p_last
  FROM profiles p
  INNER JOIN subscriptions s ON s.user_id = p.id
  WHERE p.role = 'STUDENT' 
    AND s.status = 'active';

  -- PLANOS ATIVOS: Contagem total de contratos (se um aluno tiver 2 ativos, conta 2)
  SELECT 
    count(*),
    count(*) FILTER (WHERE created_at < current_month_start)
  INTO s_current, s_last
  FROM subscriptions
  WHERE status = 'active';

  -- REDAÇÕES PENDENTES E ENVIOS
  SELECT 
    count(*) FILTER (WHERE status = 'pending'),
    count(*) FILTER (WHERE created_at >= current_month_start),
    count(*) FILTER (WHERE created_at >= last_month_start AND created_at < current_month_start)
  INTO e_pending, e_current, e_last
  FROM essays;

  RETURN json_build_object(
    'current_students', p_current,
    'last_month_students', p_last,
    'pending_essays', e_pending,
    'current_essays', e_current,
    'last_month_essays', e_last,
    'current_plans', s_current,
    'last_month_plans', s_last
  );
END;
$$;


--
-- Name: get_my_role(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_my_role() RETURNS text
    LANGUAGE sql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  select role from public.profiles where id = auth.uid();
$$;


--
-- Name: get_student_evolution(uuid, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_student_evolution(p_user_id uuid, p_months_count integer DEFAULT 6) RETURNS TABLE(month_text text, average_score numeric)
    LANGUAGE plpgsql
    AS $$
BEGIN
  RETURN QUERY
  WITH month_series AS (
    -- Gera os últimos X meses começando do primeiro dia do mês atual
    SELECT 
      date_trunc('month', current_date) - (n * interval '1 month') as month_date
    FROM generate_series(0, p_months_count - 1) n
  ),
  monthly_averages AS (
    -- Calcula a média real das redações do aluno
    SELECT 
      date_trunc('month', created_at) as essay_month,
      AVG(total_score) as score
    FROM essays
    WHERE student_id = p_user_id 
      AND status = 'corrected'
      AND created_at >= (date_trunc('month', current_date) - (p_months_count - 1) * interval '1 month')
    GROUP BY 1
  )
  SELECT 
    -- Formata o mês para o padrão que você usa (JAN, FEV, MAR...)
    -- Usamos CASE para garantir que a tradução fique correta independente do locale do banco
    CASE extract(month from ms.month_date)
      WHEN 1 THEN 'JAN' WHEN 2 THEN 'FEV' WHEN 3 THEN 'MAR'
      WHEN 4 THEN 'ABR' WHEN 5 THEN 'MAI' WHEN 6 THEN 'JUN'
      WHEN 7 THEN 'JUL' WHEN 8 THEN 'AGO' WHEN 9 THEN 'SET'
      WHEN 10 THEN 'OUT' WHEN 11 THEN 'NOV' WHEN 12 THEN 'DEZ'
    END as month_text,
    COALESCE(ROUND(ma.score), 0) as average_score
  FROM month_series ms
  LEFT JOIN monthly_averages ma ON ms.month_date = ma.essay_month
  ORDER BY ms.month_date ASC;
END;
$$;


--
-- Name: get_subscription_history_events(uuid, integer, integer, text, timestamp with time zone, timestamp with time zone); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_subscription_history_events(p_user_id uuid DEFAULT NULL::uuid, p_page integer DEFAULT 1, p_limit integer DEFAULT 10, p_transaction_type text DEFAULT NULL::text, p_from timestamp with time zone DEFAULT NULL::timestamp with time zone, p_to timestamp with time zone DEFAULT NULL::timestamp with time zone) RETURNS TABLE(kind text, id uuid, user_id uuid, created_at timestamp with time zone, transaction_type text, credit_amount integer, description text, student_payment_id uuid, paid_at timestamp with time zone, amount_in_cents integer, credits_amount integer, payment_status text, payment_method text, plan_id uuid, plan_name text, subscription_id uuid, metadata jsonb, total_count bigint)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
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
  with history_events as (
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

      ct.metadata,

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

    from public.credit_transactions ct

    left join public.student_payments payment
      on payment.id = ct.student_payment_id

    where ct.user_id = v_target_user_id

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


--
-- Name: get_teacher_average_time(uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_teacher_average_time(p_teacher_id uuid, p_range text) RETURNS integer
    LANGUAGE sql
    AS $$SELECT 
    COALESCE(
      ROUND(
        AVG(
          EXTRACT(EPOCH FROM (correction_date - started_correction_at)) / 60
        )
      ), 
      0
    )::INTEGER
  FROM essays
  WHERE teacher_id = p_teacher_id
    AND status = 'corrected'
    AND started_correction_at IS NOT NULL
    AND (
      -- Pega do dia 1º do mês atual até hoje (Fuso de SP)
      (p_range = 'current_month' AND correction_date >= date_trunc('month', CURRENT_DATE AT TIME ZONE 'America/Sao_Paulo')) OR
      (p_range = '30d' AND correction_date >= (CURRENT_DATE AT TIME ZONE 'America/Sao_Paulo') - INTERVAL '30 days') OR
      (p_range = '60d' AND correction_date >= (CURRENT_DATE AT TIME ZONE 'America/Sao_Paulo') - INTERVAL '60 days') OR
      (p_range = '90d' AND correction_date >= (CURRENT_DATE AT TIME ZONE 'America/Sao_Paulo') - INTERVAL '90 days')
    );$$;


--
-- Name: get_teacher_correction_heatmap(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_teacher_correction_heatmap(p_teacher_id uuid) RETURNS TABLE(date text, count integer)
    LANGUAGE sql
    AS $$SELECT 
    TO_CHAR(correction_date AT TIME ZONE 'America/Sao_Paulo', 'YYYY-MM-DD') AS date,
    COUNT(*)::integer AS count
  FROM essays
  WHERE teacher_id = p_teacher_id
    AND status = 'corrected'
    AND correction_date >= CURRENT_DATE - INTERVAL '6 months'
  GROUP BY TO_CHAR(correction_date AT TIME ZONE 'America/Sao_Paulo', 'YYYY-MM-DD')
  ORDER BY date ASC;$$;


--
-- Name: get_teacher_daily_averages(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_teacher_daily_averages(p_teacher_id uuid) RETURNS TABLE(date text, average integer)
    LANGUAGE sql
    AS $$SELECT 
    TO_CHAR(correction_date AT TIME ZONE 'America/Sao_Paulo', 'YYYY-MM-DD') AS date,
    ROUND(AVG(total_score))::INTEGER AS average
  FROM essays
  WHERE teacher_id = p_teacher_id
    AND status = 'corrected'
    AND correction_date >= CURRENT_DATE - INTERVAL '6 months'
  GROUP BY TO_CHAR(correction_date AT TIME ZONE 'America/Sao_Paulo', 'YYYY-MM-DD')
  ORDER BY date ASC;$$;


--
-- Name: get_teacher_performance_stats(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_teacher_performance_stats(p_teacher_id uuid) RETURNS json
    LANGUAGE sql
    AS $$SELECT json_build_object(
    'total', COALESCE(COUNT(*), 0),
    'total_on_time', COALESCE(COUNT(*) FILTER (WHERE correction_date <= due_date), 0),
    'total_late', COALESCE(COUNT(*) FILTER (WHERE correction_date > due_date), 0),
    
    'current_month_total', COALESCE(COUNT(*) FILTER (
      WHERE date_trunc('month', correction_date AT TIME ZONE 'UTC') = date_trunc('month', now() AT TIME ZONE 'UTC')
    ), 0),
    'current_month_on_time', COALESCE(COUNT(*) FILTER (
      WHERE date_trunc('month', correction_date AT TIME ZONE 'UTC') = date_trunc('month', now() AT TIME ZONE 'UTC') 
      AND correction_date <= due_date
    ), 0),
    'current_month_late', COALESCE(COUNT(*) FILTER (
      WHERE date_trunc('month', correction_date AT TIME ZONE 'UTC') = date_trunc('month', now() AT TIME ZONE 'UTC') 
      AND correction_date > due_date
    ), 0),
    
    'last_month_total', COALESCE(COUNT(*) FILTER (
      WHERE date_trunc('month', correction_date AT TIME ZONE 'UTC') = date_trunc('month', now() AT TIME ZONE 'UTC') - INTERVAL '1 month'
    ), 0)
  )
  FROM essays
  WHERE teacher_id = p_teacher_id
    AND status = 'corrected'
    AND correction_date IS NOT NULL
    AND due_date IS NOT NULL;$$;


--
-- Name: get_teacher_score_distribution(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_teacher_score_distribution(p_teacher_id uuid) RETURNS TABLE(range text, count integer)
    LANGUAGE sql
    AS $$WITH ranges AS (
    SELECT 
      CASE 
        WHEN total_score <= 400 THEN '0-400'
        WHEN total_score <= 600 THEN '401-600'
        WHEN total_score <= 800 THEN '601-800'
        WHEN total_score <= 900 THEN '801-900'
        ELSE '901-1000'
      END as range_label,
      COUNT(*) as qty
    FROM essays
    WHERE teacher_id = p_teacher_id AND status = 'corrected'
    GROUP BY range_label
  )
  -- Esse JOIN garante que mesmo que o professor nunca tenha dado nota 0-400, a faixa retorne com valor 0 pro gráfico não quebrar
  SELECT r.rng, COALESCE(d.qty, 0)::integer
  FROM (VALUES ('0-400'), ('401-600'), ('601-800'), ('801-900'), ('901-1000')) AS r(rng)
  LEFT JOIN ranges d ON r.rng = d.range_label
  ORDER BY r.rng;$$;


--
-- Name: get_weekly_essay_volume(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_weekly_essay_volume() RETURNS TABLE(chart_date date, sent bigint, corrected bigint)
    LANGUAGE sql
    AS $$
  -- 1. Gera os últimos 7 dias (forçando para DATE antes de subtrair o i)
  WITH dates AS (
    SELECT ((now() AT TIME ZONE 'America/Sao_Paulo')::date - i) AS d
    FROM generate_series(6, 0, -1) AS i
  ),
  -- 2. Conta as redações ENVIADAS
  sent_essays AS (
    SELECT (submission_date AT TIME ZONE 'America/Sao_Paulo')::date AS d, COUNT(*) AS c
    FROM essays
    WHERE submission_date >= ((now() AT TIME ZONE 'America/Sao_Paulo')::date - 6)
    GROUP BY 1
  ),
  -- 3. Conta as redações CORRIGIDAS
  corrected_essays AS (
    SELECT (correction_date AT TIME ZONE 'America/Sao_Paulo')::date AS d, COUNT(*) AS c
    FROM essays
    WHERE status = 'done' 
      AND correction_date >= ((now() AT TIME ZONE 'America/Sao_Paulo')::date - 6)
    GROUP BY 1
  )
  -- 4. Junta tudo
  SELECT
    dates.d AS chart_date,
    COALESCE(sent_essays.c, 0) AS sent,
    COALESCE(corrected_essays.c, 0) AS corrected
  FROM dates
  LEFT JOIN sent_essays ON dates.d = sent_essays.d
  LEFT JOIN corrected_essays ON dates.d = corrected_essays.d
  ORDER BY dates.d ASC;
$$;


--
-- Name: get_weekly_essay_volume(integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_weekly_essay_volume(weeks_ago integer DEFAULT 0) RETURNS TABLE(chart_date date, sent bigint, corrected bigint)
    LANGUAGE sql
    AS $$
  -- 1. Encontra a Segunda-feira da semana desejada
  WITH monday AS (
    SELECT (DATE_TRUNC('week', now() AT TIME ZONE 'America/Sao_Paulo') - (INTERVAL '1 week' * weeks_ago))::date AS d
  ),
  -- 2. Gera os 7 dias exatos (de Segunda a Domingo) a partir daquela Segunda-feira
  dates AS (
    SELECT (monday.d + i) AS d
    FROM monday, generate_series(0, 6) AS i
  ),
  -- 3. Conta as enviadas naquele intervalo de 7 dias
  sent_essays AS (
    SELECT (submission_date AT TIME ZONE 'America/Sao_Paulo')::date AS d, COUNT(*) AS c
    FROM essays
    WHERE submission_date >= (SELECT d FROM monday)
      AND submission_date < (SELECT d + 7 FROM monday)
    GROUP BY 1
  ),
  -- 4. Conta as corrigidas naquele intervalo de 7 dias
  corrected_essays AS (
    SELECT (correction_date AT TIME ZONE 'America/Sao_Paulo')::date AS d, COUNT(*) AS c
    FROM essays
    WHERE status = 'done' 
      AND correction_date >= (SELECT d FROM monday)
      AND correction_date < (SELECT d + 7 FROM monday)
    GROUP BY 1
  )
  -- 5. Junta tudo
  SELECT
    dates.d AS chart_date,
    COALESCE(sent_essays.c, 0) AS sent,
    COALESCE(corrected_essays.c, 0) AS corrected
  FROM dates
  LEFT JOIN sent_essays ON dates.d = sent_essays.d
  LEFT JOIN corrected_essays ON dates.d = corrected_essays.d
  ORDER BY dates.d ASC;
$$;


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare
  v_role public.app_role;
  v_acquisition_channel text;

  v_free_plan_id uuid;
  v_free_subscription_id uuid;

  v_free_allocation_id uuid;
  v_free_credit_transaction_id uuid;
  v_free_credit_expires_at timestamptz;
begin
  v_role :=
    (new.raw_user_meta_data ->> 'role')::public.app_role;

  v_acquisition_channel :=
    coalesce(
      nullif(
        new.raw_user_meta_data ->> 'acquisition_channel',
        ''
      ),
      'ORGANIC'
    );

  /*
   * 1. Cria o perfil.
   */
  insert into public.profiles (
    id,
    email,
    full_name,
    role,
    document,
    phone_country_code,
    phone,
    terms_accepted_at,
    acquisition_channel
  )
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    v_role,
    new.raw_user_meta_data ->> 'document',
    coalesce(
      nullif(
        new.raw_user_meta_data ->> 'phone_country_code',
        ''
      ),
      '55'
    ),
    new.raw_user_meta_data ->> 'phone',
    (
      new.raw_user_meta_data ->> 'terms_accepted_at'
    )::timestamptz,
    v_acquisition_channel
  );

  /*
   * 2. Concede o Plano Gratuito apenas para alunos
   * que não vieram da Mentoria Hotmart.
   */
  if v_role = 'STUDENT'::public.app_role
    and v_acquisition_channel <> 'HOTMART_MENTORIA'
  then
    select plan.id
    into v_free_plan_id
    from public.plans as plan
    where plan.external_id = 'internal_free_trial'
      and plan.is_active = true;

    if not found then
      raise exception
        'O Plano Gratuito não está cadastrado ou está inativo.';
    end if;

    /*
     * 3. Define a validade:
     * 23h59:59 do 15º dia após a concessão,
     * considerando o horário de São Paulo.
     */
    v_free_credit_expires_at :=
      (
        (
          timezone(
            'America/Sao_Paulo',
            coalesce(new.created_at, now())
          )::date
          + 15
        )
        + time '23:59:59.999999'
      ) at time zone 'America/Sao_Paulo';

    v_free_allocation_id := gen_random_uuid();

    /*
     * 4. Cria a assinatura gratuita interna.
     */
    insert into public.subscriptions (
      user_id,
      plan_id,
      status,
      current_period_start,
      current_period_end,
      cancel_at_period_end,
      external_id,
      payment_method,
      payment_card_id,
      metadata,
      updated_at
    )
    values (
      new.id,
      v_free_plan_id,
      'trial',
      coalesce(new.created_at, now()),
      null,
      false,
      'internal-free-trial:' || new.id::text,
      null,
      null,
      jsonb_build_object(
        'provider',
        'internal',
        'subscription_type',
        'free_trial',
        'acquisition_channel',
        v_acquisition_channel,
        'granted_automatically',
        true,
        'free_credit_expires_at',
        v_free_credit_expires_at
      ),
      now()
    )
    returning id
    into v_free_subscription_id;

    /*
     * 5. Registra a concessão na carteira gratuita.
     */
    insert into public.credit_transactions (
      user_id,
      type,
      amount,
      description,
      metadata
    )
    values (
      new.id,
      'free_trial_grant',
      1,
      'Liberação da correção gratuita de boas-vindas.',
      jsonb_build_object(
        'source',
        'automatic_free_trial',
        'credit_type',
        'free',
        'plan_source',
        'free_trial',
        'free_credit_allocation_id',
        v_free_allocation_id,
        'subscription_id',
        v_free_subscription_id,
        'plan_id',
        v_free_plan_id,
        'acquisition_channel',
        v_acquisition_channel,
        'credits_granted',
        1,
        'expires_at',
        v_free_credit_expires_at
      )
    )
    returning id
    into v_free_credit_transaction_id;

    /*
     * 6. Cria a alocação responsável pelo saldo
     * e pela validade do crédito gratuito.
     */
    insert into public.free_credit_allocations (
      id,
      user_id,
      subscription_id,
      amount,
      remaining_amount,
      granted_at,
      expires_at,
      status,
      grant_transaction_id,
      updated_at
    )
    values (
      v_free_allocation_id,
      new.id,
      v_free_subscription_id,
      1,
      1,
      coalesce(new.created_at, now()),
      v_free_credit_expires_at,
      'active',
      v_free_credit_transaction_id,
      now()
    );
  end if;

  return new;
end;
$$;


--
-- Name: initialize_mentorship_credit_schedule(uuid, uuid, uuid, timestamp with time zone); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.initialize_mentorship_credit_schedule(p_access_id uuid, p_subscription_id uuid, p_user_id uuid, p_start_at timestamp with time zone DEFAULT now()) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare
  v_cycle_1_id uuid;
  v_cycle_1_grant_transaction_id uuid;
  v_new_transaction_id uuid;

  v_hotmart_transaction_id text;

  v_plan_id uuid;
  v_plan_name text;

  v_start_local_date date;

  v_cycle_1_available_at timestamptz;
  v_cycle_1_expires_at timestamptz;

  v_cycle_2_available_at timestamptz;
  v_cycle_2_expires_at timestamptz;

  v_cycle_3_available_at timestamptz;
  v_cycle_3_expires_at timestamptz;

  v_subscription_end_at timestamptz;
begin
  if p_start_at is null then
    raise exception
      'A data inicial da mentoria é obrigatória.';
  end if;

  /*
   * 1. Calcula as datas considerando o calendário
   * de America/Sao_Paulo.
   *
   * O primeiro ciclo começa imediatamente.
   * As trocas acontecem à meia-noite.
   */
  v_start_local_date :=
    (p_start_at at time zone 'America/Sao_Paulo')::date;

  v_cycle_1_available_at := p_start_at;

  v_cycle_1_expires_at :=
    (
      v_start_local_date + interval '1 month'
    ) at time zone 'America/Sao_Paulo';

  v_cycle_2_available_at :=
    v_cycle_1_expires_at;

  v_cycle_2_expires_at :=
    (
      v_start_local_date + interval '2 months'
    ) at time zone 'America/Sao_Paulo';

  v_cycle_3_available_at :=
    v_cycle_2_expires_at;

  v_cycle_3_expires_at :=
    (
      v_start_local_date + interval '3 months'
    ) at time zone 'America/Sao_Paulo';

  /*
   * 2. Localiza e trava o acesso da Hotmart.
   */
  select access.transaction_id
  into v_hotmart_transaction_id
  from public.hotmart_mentorship_accesses as access
  where access.id = p_access_id
  for update;

  if not found then
    raise exception
      'Acesso da mentoria não encontrado.';
  end if;

  /*
   * 3. Valida o perfil do aluno.
   */
  if not exists (
    select 1
    from public.profiles as profile
    where profile.id = p_user_id
      and profile.role = 'STUDENT'
  ) then
    raise exception
      'Perfil de aluno não encontrado.';
  end if;

  /*
   * 4. Valida a assinatura e confirma que ela pertence
   * ao Plano Mentoria.
   */
  select
    plan.id,
    plan.name
  into
    v_plan_id,
    v_plan_name
  from public.subscriptions as subscription

  join public.plans as plan
    on plan.id = subscription.plan_id

  where subscription.id = p_subscription_id
    and subscription.user_id = p_user_id
    and plan.external_id = 'internal_mentoria_free';

  if not found then
    raise exception
      'Assinatura do Plano Mentoria não encontrada.';
  end if;

  /*
   * 5. Cria os três ciclos.
   */
  insert into public.mentorship_credit_allocations (
    mentorship_access_id,
    subscription_id,
    user_id,
    cycle_number,
    amount,
    remaining_amount,
    available_at,
    expires_at,
    released_at,
    status
  )
  values
    (
      p_access_id,
      p_subscription_id,
      p_user_id,
      1,
      2,
      2,
      v_cycle_1_available_at,
      v_cycle_1_expires_at,
      p_start_at,
      'active'
    ),
    (
      p_access_id,
      p_subscription_id,
      p_user_id,
      2,
      2,
      0,
      v_cycle_2_available_at,
      v_cycle_2_expires_at,
      null,
      'scheduled'
    ),
    (
      p_access_id,
      p_subscription_id,
      p_user_id,
      3,
      1,
      0,
      v_cycle_3_available_at,
      v_cycle_3_expires_at,
      null,
      'scheduled'
    )
  on conflict (
    mentorship_access_id,
    cycle_number
  )
  do nothing;

  /*
   * 6. Usa o fim real do terceiro ciclo como data final
   * da assinatura.
   *
   * A consulta é feita na tabela para manter a função
   * idempotente: se os ciclos já existirem, reutilizamos
   * a data originalmente armazenada.
   */
  select allocation.expires_at
  into v_subscription_end_at
  from public.mentorship_credit_allocations as allocation
  where allocation.mentorship_access_id = p_access_id
    and allocation.subscription_id = p_subscription_id
    and allocation.user_id = p_user_id
    and allocation.cycle_number = 3;

  if not found then
    raise exception
      'Não foi possível localizar o último ciclo da mentoria.';
  end if;

  update public.subscriptions
  set
    current_period_end = v_subscription_end_at,
    updated_at = now()
  where id = p_subscription_id
    and user_id = p_user_id;

  if not found then
    raise exception
      'Não foi possível atualizar o período da assinatura da mentoria.';
  end if;

  /*
   * 7. Recupera e trava o primeiro ciclo.
   */
  select
    allocation.id,
    allocation.grant_transaction_id
  into
    v_cycle_1_id,
    v_cycle_1_grant_transaction_id
  from public.mentorship_credit_allocations as allocation
  where allocation.mentorship_access_id = p_access_id
    and allocation.cycle_number = 1
  for update;

  if not found then
    raise exception
      'Não foi possível localizar o primeiro ciclo da mentoria.';
  end if;

  /*
   * 8. Libera os primeiros dois créditos apenas uma vez.
   */
  if v_cycle_1_grant_transaction_id is null then
    insert into public.credit_transactions (
      user_id,
      type,
      amount,
      description,
      metadata
    )
    values (
      p_user_id,
      'mentorship_bonus',
      2,
      'Liberação de 2 créditos do ciclo 1 do Plano Mentoria.',
      jsonb_build_object(
        'source',
        'hotmart_mentorship_schedule',

        'grant_type',
        'mentorship_cycle_release',

        'acquisition_channel',
        'HOTMART_MENTORIA',

        'hotmart_transaction_id',
        v_hotmart_transaction_id,

        'hotmart_access_id',
        p_access_id,

        'subscription_id',
        p_subscription_id,

        'plan_id',
        v_plan_id,

        'plan_name',
        v_plan_name,

        'credit_type',
        'plan',

        'plan_source',
        'mentorship',

        'mentorship_allocation_id',
        v_cycle_1_id,

        'mentorship_cycle_number',
        1,

        'release_sequence',
        '2/2/1',

        'available_at',
        v_cycle_1_available_at,

        'expires_at',
        v_cycle_1_expires_at
      )
    )
    returning id into v_new_transaction_id;

    update public.mentorship_credit_allocations
    set
      grant_transaction_id = v_new_transaction_id,
      updated_at = now()
    where id = v_cycle_1_id;
  end if;
end;
$$;


--
-- Name: is_admin(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_admin() RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'ADMIN'
  );
END;
$$;


--
-- Name: log_subscription_status_change(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.log_subscription_status_change() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare
  v_change_type text;
begin
  /*
   * Criação inicial da assinatura.
   */
  if tg_op = 'INSERT' then
    insert into public.subscription_history (
      subscription_id,
      old_status,
      new_status,
      change_type,
      old_plan_id,
      new_plan_id,
      old_external_id,
      new_external_id,
      metadata
    )
    values (
      new.id,
      null,
      new.status::text,
      'created',
      null,
      new.plan_id,
      null,
      new.external_id,
      jsonb_build_object(
        'source',
        'subscriptions_trigger',
        'cancel_at_period_end',
        new.cancel_at_period_end
      )
    );

    return new;
  end if;

  /*
   * Ignora updates sem alterações relevantes
   * para o histórico da assinatura.
   */
  if old.status is not distinct from new.status
    and old.plan_id is not distinct from new.plan_id
    and old.external_id is not distinct from new.external_id
    and old.cancel_at_period_end
      is not distinct from
        new.cancel_at_period_end
  then
    return new;
  end if;

  /*
   * Cancelamento agendado concluído no fim do ciclo.
   */
  if new.status = 'canceled'
    and old.status is distinct from new.status
    and old.cancel_at_period_end = true
  then
    v_change_type := 'cancellation_completed';

  /*
   * Assinatura cancelada sendo refeita
   * para o mesmo plano.
   */
  elsif old.status = 'canceled'
    and new.status = 'active'
    and old.plan_id is not distinct from new.plan_id
  then
    v_change_type := 'reactivation';

  /*
   * Solicitação de cancelamento no fim do ciclo.
   */
  elsif coalesce(
      old.cancel_at_period_end,
      false
    ) = false
    and new.cancel_at_period_end = true
  then
    v_change_type := 'cancellation_scheduled';

  /*
   * Cancelamento agendado removido.
   *
   * Pode ser usado futuramente em um fluxo
   * de desistência do cancelamento.
   */
  elsif old.cancel_at_period_end = true
    and coalesce(
      new.cancel_at_period_end,
      false
    ) = false
    and old.status is not distinct from new.status
  then
    v_change_type :=
      'cancellation_schedule_cleared';

  /*
   * Plano e status alterados juntos.
   */
  elsif old.plan_id is distinct from new.plan_id
    and old.status is distinct from new.status
  then
    v_change_type :=
      'plan_and_status_change';

  /*
   * Troca de plano mantendo o status.
   */
  elsif old.plan_id is distinct from new.plan_id
  then
    v_change_type := 'plan_change';

  /*
   * Nova assinatura externa.
   */
  elsif old.external_id
    is distinct from new.external_id
  then
    v_change_type :=
      'external_subscription_change';

  else
    v_change_type := 'status_change';
  end if;

  insert into public.subscription_history (
    subscription_id,
    old_status,
    new_status,
    change_type,
    old_plan_id,
    new_plan_id,
    old_external_id,
    new_external_id,
    metadata
  )
  values (
    new.id,
    old.status::text,
    new.status::text,
    v_change_type,
    old.plan_id,
    new.plan_id,
    old.external_id,
    new.external_id,
    jsonb_build_object(
      'source',
      'subscriptions_trigger',

      'old_cancel_at_period_end',
      old.cancel_at_period_end,

      'new_cancel_at_period_end',
      new.cancel_at_period_end,

      'cancellation_requested_at',
      new.cancellation_requested_at,

      'cancellation_effective_at',
      new.cancellation_effective_at,

      'cancellation_reason',
      new.cancellation_reason,

      'cancellation_provider_status',
      new.cancellation_provider_status
    )
  );

  return new;
end;
$$;


--
-- Name: process_expired_free_credits(timestamp with time zone); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.process_expired_free_credits(p_reference_at timestamp with time zone DEFAULT now()) RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare
  v_allocation record;
  v_expiration_transaction_id uuid;
  v_processed_count integer := 0;
begin
  for v_allocation in
    select
      allocation.id,
      allocation.user_id,
      allocation.subscription_id,
      allocation.remaining_amount,
      allocation.expires_at
    from public.free_credit_allocations as allocation
    where allocation.status = 'active'
      and allocation.expires_at <= p_reference_at
    order by allocation.expires_at asc
    for update skip locked
  loop
    v_expiration_transaction_id := null;

    /*
     * Registra a retirada apenas quando ainda existe
     * crédito gratuito disponível.
     */
    if v_allocation.remaining_amount > 0 then
      insert into public.credit_transactions (
        user_id,
        type,
        amount,
        description,
        metadata
      )
      values (
        v_allocation.user_id,
        'free_credit_expiration',
        -v_allocation.remaining_amount,
        'Expiração do crédito gratuito de boas-vindas.',
        jsonb_build_object(
          'source',
          'free_credit_expiration_job',

          'credit_type',
          'free',

          'credit_source',
          'free_trial',

          'free_credit_allocation_id',
          v_allocation.id,

          'subscription_id',
          v_allocation.subscription_id,

          'expires_at',
          v_allocation.expires_at,

          'processed_at',
          p_reference_at
        )
      )
      returning id
      into v_expiration_transaction_id;
    end if;

    update public.free_credit_allocations
    set
      remaining_amount = 0,
      status = 'expired',
      expiration_transaction_id =
        v_expiration_transaction_id,
      updated_at = p_reference_at
    where id = v_allocation.id;

    v_processed_count :=
      v_processed_count + 1;
  end loop;

  return v_processed_count;
end;
$$;


--
-- Name: process_mentorship_credit_allocations(timestamp with time zone); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.process_mentorship_credit_allocations(p_reference_at timestamp with time zone DEFAULT now()) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare
  v_allocation record;

  v_expiration_transaction_id uuid;
  v_grant_transaction_id uuid;

  v_expired_allocations integer := 0;
  v_expired_credits integer := 0;

  v_released_allocations integer := 0;
  v_released_credits integer := 0;
begin
  if p_reference_at is null then
    raise exception 'A data de referência é obrigatória.';
  end if;

  /*
   * 1. Expira todos os ciclos cuja validade terminou.
   *
   * Isso inclui:
   * - ciclos ativos com saldo restante;
   * - ciclos totalmente consumidos;
   * - ciclos agendados cujo período inteiro já passou.
   *
   * Ciclos agendados que já venceram não são liberados
   * retroativamente, pois os créditos não são cumulativos.
   */
  for v_allocation in
    select
      allocation.id,
      allocation.user_id,
      allocation.mentorship_access_id,
      allocation.subscription_id,
      allocation.cycle_number,
      allocation.amount,
      allocation.remaining_amount,
      allocation.available_at,
      allocation.expires_at,
      allocation.status,
      allocation.grant_transaction_id,
      allocation.expiration_transaction_id
    from public.mentorship_credit_allocations as allocation
    where allocation.status in (
      'scheduled',
      'active',
      'consumed'
    )
      and allocation.expires_at <= p_reference_at
    order by
      allocation.expires_at asc,
      allocation.cycle_number asc
    for update skip locked
  loop
    v_expiration_transaction_id := null;

    /*
     * Só registra saída financeira quando o lote
     * realmente possui créditos restantes.
     *
     * Um ciclo scheduled que nunca foi liberado
     * simplesmente é marcado como expirado.
     */
    if v_allocation.remaining_amount > 0
      and v_allocation.expiration_transaction_id is null
    then
      insert into public.credit_transactions (
        user_id,
        type,
        amount,
        description,
        metadata
      )
      values (
        v_allocation.user_id,
        'mentorship_expiration',
        -v_allocation.remaining_amount,
        format(
          'Expiração de %s crédito(s) do ciclo %s do Plano Mentoria.',
          v_allocation.remaining_amount,
          v_allocation.cycle_number
        ),
        jsonb_build_object(
          'source',
          'mentorship_schedule',

          'credit_type',
          'plan',

          'plan_source',
          'mentorship',

          'mentorship_access_id',
          v_allocation.mentorship_access_id,

          'subscription_id',
          v_allocation.subscription_id,

          'mentorship_allocation_id',
          v_allocation.id,

          'mentorship_cycle_number',
          v_allocation.cycle_number,

          'expired_amount',
          v_allocation.remaining_amount,

          'available_at',
          v_allocation.available_at,

          'expires_at',
          v_allocation.expires_at,

          'processed_at',
          p_reference_at
        )
      )
      returning id into v_expiration_transaction_id;

      v_expired_credits :=
        v_expired_credits +
        v_allocation.remaining_amount;
    end if;

    update public.mentorship_credit_allocations
    set
      remaining_amount = 0,
      status = 'expired',
      expired_at = coalesce(
        expired_at,
        p_reference_at
      ),
      expiration_transaction_id = coalesce(
        expiration_transaction_id,
        v_expiration_transaction_id
      ),
      updated_at = now()
    where id = v_allocation.id;

    v_expired_allocations :=
      v_expired_allocations + 1;
  end loop;

  /*
   * 2. Libera o ciclo atualmente válido.
   *
   * Um ciclo somente é liberado quando:
   * - sua data inicial já chegou;
   * - sua data final ainda não chegou;
   * - ele continua agendado;
   * - ainda não existe transação de liberação.
   */
  for v_allocation in
    select
      allocation.id,
      allocation.user_id,
      allocation.mentorship_access_id,
      allocation.subscription_id,
      allocation.cycle_number,
      allocation.amount,
      allocation.available_at,
      allocation.expires_at
    from public.mentorship_credit_allocations as allocation
    where allocation.status = 'scheduled'
      and allocation.grant_transaction_id is null
      and allocation.available_at <= p_reference_at
      and allocation.expires_at > p_reference_at
    order by
      allocation.available_at asc,
      allocation.cycle_number asc
    for update skip locked
  loop
    insert into public.credit_transactions (
      user_id,
      type,
      amount,
      description,
      metadata
    )
    values (
      v_allocation.user_id,
      'mentorship_bonus',
      v_allocation.amount,
      format(
        'Liberação de %s crédito(s) do ciclo %s do Plano Mentoria.',
        v_allocation.amount,
        v_allocation.cycle_number
      ),
      jsonb_build_object(
        'source',
        'mentorship_schedule',

        'grant_type',
        'mentorship_cycle_release',

        'credit_type',
        'plan',

        'plan_source',
        'mentorship',

        'mentorship_access_id',
        v_allocation.mentorship_access_id,

        'subscription_id',
        v_allocation.subscription_id,

        'mentorship_allocation_id',
        v_allocation.id,

        'mentorship_cycle_number',
        v_allocation.cycle_number,

        'release_sequence',
        '2/2/1',

        'available_at',
        v_allocation.available_at,

        'expires_at',
        v_allocation.expires_at,

        'processed_at',
        p_reference_at
      )
    )
    returning id into v_grant_transaction_id;

    update public.mentorship_credit_allocations
    set
      remaining_amount = amount,
      status = 'active',
      released_at = p_reference_at,
      grant_transaction_id =
        v_grant_transaction_id,
      updated_at = now()
    where id = v_allocation.id;

    v_released_allocations :=
      v_released_allocations + 1;

    v_released_credits :=
      v_released_credits +
      v_allocation.amount;
  end loop;

  return jsonb_build_object(
    'reference_at',
    p_reference_at,

    'expired_allocations',
    v_expired_allocations,

    'expired_credits',
    v_expired_credits,

    'released_allocations',
    v_released_allocations,

    'released_credits',
    v_released_credits
  );
end;
$$;


--
-- Name: process_pagarme_subscription_cancellation(uuid, text, text, timestamp with time zone); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.process_pagarme_subscription_cancellation(p_webhook_event_id uuid, p_subscription_external_id text, p_subscription_status text, p_canceled_at timestamp with time zone DEFAULT NULL::timestamp with time zone) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$declare
  v_webhook_event public.pagarme_webhook_events%rowtype;
  v_subscription public.subscriptions%rowtype;

  v_previous_status text;
  v_effective_canceled_at timestamptz;

  v_plan_credits_balance integer := 0;
  v_expiration_transaction_id uuid;

  v_is_scheduled_cancellation boolean := false;
begin
  /*
   * Apenas o backend com service role pode executar
   * esta operação.
   */
  if coalesce(
    auth.jwt() ->> 'role',
    ''
  ) <> 'service_role' then
    raise exception
      'Acesso não autorizado.';
  end if;

  if p_webhook_event_id is null then
    raise exception
      'Evento de webhook não informado.';
  end if;

  if nullif(
    trim(p_subscription_external_id),
    ''
  ) is null then
    raise exception
      'Identificador da assinatura não informado.';
  end if;

  if lower(
    coalesce(
      p_subscription_status,
      ''
    )
  ) <> 'canceled' then
    raise exception
      'O status informado não representa uma assinatura cancelada.';
  end if;

  v_effective_canceled_at :=
    coalesce(
      p_canceled_at,
      now()
    );

  /*
   * Impede o processamento simultâneo do mesmo
   * webhook.
   */
  select *
  into v_webhook_event
  from public.pagarme_webhook_events
  where id = p_webhook_event_id
  for update;

  if not found then
    raise exception
      'Evento de webhook não encontrado.';
  end if;

  if v_webhook_event.event_type <>
    'subscription.canceled'
  then
    raise exception
      'O evento informado não representa um cancelamento de assinatura.';
  end if;

  /*
   * Confirma que o conteúdo validado e armazenado
   * corresponde aos parâmetros recebidos pela RPC.
   */
  if nullif(
    v_webhook_event.payload #>>
      '{data,id}',
    ''
  ) is distinct from
    p_subscription_external_id
  then
    raise exception
      'A assinatura informada não corresponde ao evento de webhook.';
  end if;

  if lower(
    coalesce(
      nullif(
        v_webhook_event.payload #>>
          '{data,status}',
        ''
      ),
      ''
    )
  ) <> 'canceled' then
    raise exception
      'O payload do webhook não representa uma assinatura cancelada.';
  end if;

  /*
   * Reenvio do mesmo webhook.
   */
  if v_webhook_event.status = 'processed' then
    return jsonb_build_object(
      'success', true,
      'duplicate', true,
      'ignored', false,
      'webhook_event_id',
        p_webhook_event_id
    );
  end if;

  update public.pagarme_webhook_events
  set
    status = 'processing',
    error_message = null,
    updated_at = now()
  where id = p_webhook_event_id;

  /*
   * Bloqueia a assinatura durante o processamento.
   */
  select *
  into v_subscription
  from public.subscriptions
  where external_id =
    p_subscription_external_id
  for update;

  if not found then
    raise exception
      'Assinatura local não encontrada.';
  end if;

  v_previous_status :=
    v_subscription.status;

  /*
   * A assinatura já foi finalizada anteriormente.
   */
  if v_subscription.status = 'canceled' then
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
      'ignored', true,
      'reason',
        'subscription_already_canceled',
      'subscription_id',
        v_subscription.id,
      'credits_expired',
        0,
      'webhook_event_id',
        p_webhook_event_id
    );
  end if;

  /*
   * Cancelamento solicitado pelo aluno:
   *
   * - a recorrência já foi cancelada na Pagar.me;
   * - o período pago ainda está vigente;
   * - a assinatura local permanece ativa;
   * - os créditos do plano permanecem disponíveis.
   */
  v_is_scheduled_cancellation :=
    v_subscription.cancel_at_period_end is true
    and v_subscription.current_period_end is not null
    and v_subscription.current_period_end > now();

  if v_is_scheduled_cancellation then
    update public.subscriptions
    set
      cancel_at_period_end = true,

      pending_plan_id = null,
      pending_change_type = null,
      pending_change_at = null,

      metadata =
        coalesce(
          metadata,
          '{}'::jsonb
        )
        ||
        jsonb_build_object(
          'pagarme_status',
            'canceled',

          'last_cancellation_webhook_id',
            p_webhook_event_id,

          'provider_canceled_at',
            v_effective_canceled_at,

          'status_before_cancellation',
            v_previous_status,

          'cancellation_state',
            'scheduled',

          'cancellation_effective_at',
            v_subscription.current_period_end,

          'credits_expired_on_cancellation',
            0
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
      'ignored', false,

      'reason',
        'cancellation_scheduled',

      'subscription_id',
        v_subscription.id,

      'current_status',
        v_previous_status,

      'cancel_at_period_end',
        true,

      'finalizes_at',
        v_subscription.current_period_end,

      'credits_expired',
        0,

      'webhook_event_id',
        p_webhook_event_id
    );
  end if;

  /*
   * Cancelamento imediato ou período já encerrado.
   *
   * Somente os créditos provenientes do plano
   * são expirados. Créditos extras permanecem.
   */
  select coalesce(
    plan_credits,
    0
  )
  into v_plan_credits_balance
  from public.student_credits
  where user_id =
    v_subscription.user_id;

  v_plan_credits_balance :=
    coalesce(
      v_plan_credits_balance,
      0
    );

  if v_plan_credits_balance > 0 then
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
      -v_plan_credits_balance,

      format(
        'Expiração de %s crédito(s) pelo cancelamento da assinatura.',
        v_plan_credits_balance
      ),

      null,

      jsonb_build_object(
        'source',
          'pagarme_webhook',

        'event_type',
          'subscription.canceled',

        'webhook_event_id',
          p_webhook_event_id,

        'subscription_id',
          v_subscription.id,

        'subscription_external_id',
          p_subscription_external_id,

        'plan_id',
          v_subscription.plan_id,

        'canceled_at',
          v_effective_canceled_at
      )
    )
    returning id
    into v_expiration_transaction_id;
  end if;

  /*
   * A conta do aluno permanece acessível.
   *
   * Apenas a assinatura e os créditos do plano
   * são encerrados.
   */
  update public.subscriptions
  set
    status = 'canceled',

    cancel_at_period_end = false,

    pending_plan_id = null,
    pending_change_type = null,
    pending_change_at = null,

    metadata =
      coalesce(
        metadata,
        '{}'::jsonb
      )
      ||
      jsonb_build_object(
        'pagarme_status',
          'canceled',

        'last_cancellation_webhook_id',
          p_webhook_event_id,

        'provider_canceled_at',
          v_effective_canceled_at,

        'status_before_cancellation',
          v_previous_status,

        'cancellation_state',
          'finalized',

        'cancellation_finalized_at',
          now(),

        'credits_expired_on_cancellation',
          v_plan_credits_balance,

        'cancellation_expiration_transaction_id',
          v_expiration_transaction_id
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
    'ignored', false,

    'subscription_id',
      v_subscription.id,

    'previous_status',
      v_previous_status,

    'current_status',
      'canceled',

    'credits_expired',
      v_plan_credits_balance,

    'expiration_transaction_id',
      v_expiration_transaction_id,

    'webhook_event_id',
      p_webhook_event_id
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
      'webhook_event_id',
        p_webhook_event_id
    );
end;$$;


--
-- Name: process_pagarme_subscription_payment_failure(uuid, text, text, integer, text, text, text, text, timestamp with time zone); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.process_pagarme_subscription_payment_failure(p_webhook_event_id uuid, p_subscription_external_id text, p_invoice_external_id text, p_invoice_amount integer, p_invoice_status text, p_payment_method text DEFAULT NULL::text, p_failure_code text DEFAULT NULL::text, p_failure_message text DEFAULT NULL::text, p_failed_at timestamp with time zone DEFAULT NULL::timestamp with time zone) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare
  v_webhook_event public.pagarme_webhook_events%rowtype;
  v_subscription public.subscriptions%rowtype;

  v_effective_failed_at timestamptz;
  v_previous_status text;
begin
  if coalesce(
    auth.jwt() ->> 'role',
    ''
  ) <> 'service_role' then
    raise exception
      'Acesso não autorizado.';
  end if;

  if p_webhook_event_id is null then
    raise exception
      'Evento de webhook não informado.';
  end if;

  if p_subscription_external_id is null
    or p_invoice_external_id is null
  then
    raise exception
      'Identificadores da falha de pagamento não informados.';
  end if;

  if p_invoice_amount is null
    or p_invoice_amount <= 0
  then
    raise exception
      'O valor da fatura deve ser maior que zero.';
  end if;

  if p_invoice_status = 'paid' then
    raise exception
      'Uma fatura paga não pode ser processada como falha.';
  end if;

  if p_payment_method is not null
    and p_payment_method not in (
      'credit_card',
      'debit_card',
      'boleto'
    )
  then
    raise exception
      'Método de pagamento inválido.';
  end if;

  v_effective_failed_at :=
    coalesce(
      p_failed_at,
      now()
    );

  /*
   * Bloqueia o evento para impedir o processamento
   * simultâneo do mesmo webhook.
   */
  select *
  into v_webhook_event
  from public.pagarme_webhook_events
  where id = p_webhook_event_id
  for update;

  if not found then
    raise exception
      'Evento de webhook não encontrado.';
  end if;

  if v_webhook_event.event_type <>
    'invoice.payment_failed'
  then
    raise exception
      'O evento informado não representa uma falha de pagamento.';
  end if;

  /*
   * Confirma que os parâmetros correspondem ao
   * payload autenticado armazenado para o webhook.
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
    v_webhook_event.payload #>>
      '{data,subscription,id}',
    ''
  ) is distinct from
    p_subscription_external_id
  then
    raise exception
      'A assinatura informada não corresponde ao evento de webhook.';
  end if;

  /*
   * Reenvios não repetem nenhuma alteração.
   */
  if v_webhook_event.status = 'processed' then
    return jsonb_build_object(
      'success', true,
      'duplicate', true,
      'webhook_event_id',
        p_webhook_event_id
    );
  end if;

  update public.pagarme_webhook_events
  set
    status = 'processing',
    error_message = null,
    updated_at = now()
  where id = p_webhook_event_id;

  /*
   * Bloqueia a assinatura durante a atualização.
   */
  select *
  into v_subscription
  from public.subscriptions
  where external_id =
    p_subscription_external_id
  for update;

  if not found then
    raise exception
      'Assinatura local não encontrada.';
  end if;

  v_previous_status :=
    v_subscription.status;

  /*
   * Eventos atrasados não podem alterar assinaturas
   * que já foram encerradas.
   */
  if v_subscription.status not in (
    'active',
    'trial',
    'past_due'
  ) then
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
      'ignored', true,
      'reason',
        'subscription_status_not_renewable',
      'subscription_id',
        v_subscription.id,
      'subscription_status',
        v_subscription.status,
      'webhook_event_id',
        p_webhook_event_id
    );
  end if;

  /*
   * Uma assinatura que já está agendada para
   * cancelamento não deve ser convertida para
   * inadimplente por um evento atrasado.
   */
  if v_subscription.cancel_at_period_end then
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
      'ignored', true,
      'reason',
        'subscription_cancellation_scheduled',
      'subscription_id',
        v_subscription.id,
      'webhook_event_id',
        p_webhook_event_id
    );
  end if;

  /*
   * Não alteramos:
   *
   * - plano;
   * - período atual;
   * - saldo de créditos;
   * - alteração de plano pendente.
   *
   * O status past_due será usado pelo sistema para
   * bloquear novos usos enquanto a cobrança não for
   * recuperada.
   */
  update public.subscriptions
  set
    status = 'past_due',

    metadata =
      coalesce(
        metadata,
        '{}'::jsonb
      )
      ||
      jsonb_build_object(
        'last_payment_failure_webhook_id',
          p_webhook_event_id,

        'last_payment_failure_invoice_id',
          p_invoice_external_id,

        'last_payment_failure_amount',
          p_invoice_amount,

        'last_payment_failure_status',
          p_invoice_status,

        'last_payment_failure_method',
          p_payment_method,

        'last_payment_failure_code',
          p_failure_code,

        'last_payment_failure_message',
          p_failure_message,

        'last_payment_failed_at',
          v_effective_failed_at,

        'status_before_payment_failure',
          v_previous_status
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
    'ignored', false,

    'subscription_id',
      v_subscription.id,

    'previous_status',
      v_previous_status,

    'current_status',
      'past_due',

    'invoice_external_id',
      p_invoice_external_id,

    'credits_preserved',
      true,

    'pending_plan_change_preserved',
      v_subscription.pending_plan_id
        is not null,

    'webhook_event_id',
      p_webhook_event_id
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
      'webhook_event_id',
        p_webhook_event_id
    );
end;
$$;


--
-- Name: process_pagarme_subscription_renewal(uuid, text, text, integer, text, text, timestamp with time zone, timestamp with time zone, timestamp with time zone, timestamp with time zone); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.process_pagarme_subscription_renewal(p_webhook_event_id uuid, p_subscription_external_id text, p_invoice_external_id text, p_invoice_amount integer, p_invoice_status text, p_payment_method text, p_period_start timestamp with time zone, p_period_end timestamp with time zone, p_next_billing_at timestamp with time zone, p_paid_at timestamp with time zone DEFAULT NULL::timestamp with time zone) RETURNS jsonb
    LANGUAGE plpgsql
    SET search_path TO ''
    AS $$
declare
  v_webhook_event public.pagarme_webhook_events%rowtype;
  v_subscription public.subscriptions%rowtype;
  v_current_plan public.plans%rowtype;
  v_effective_plan public.plans%rowtype;

  v_existing_payment record;
  v_payment_id uuid;

  v_plan_balance integer := 0;
  v_apply_downgrade boolean := false;
  v_effective_payment_method text;
  v_effective_paid_at timestamptz;
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

  select *
  into v_current_plan
  from public.plans
  where id = v_subscription.plan_id;

  if not found then
    raise exception 'Plano atual da assinatura não encontrado.';
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
  else
    v_effective_plan := v_current_plan;
  end if;

  /*
   * A fatura deve corresponder ao plano efetivamente
   * renovado.
   */
  if p_invoice_amount <> v_effective_plan.price then
    raise exception
      'O valor da fatura não corresponde ao valor do plano da renovação.';
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
      'plan_id', v_effective_plan.id
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
    v_effective_plan.id,
    v_subscription.payment_card_id,
    'subscription',
    'pagarme',
    p_invoice_external_id,
    p_invoice_amount,
    v_effective_plan.credits_included,
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
      'previous_plan_id', v_current_plan.id,
      'effective_plan_id', v_effective_plan.id,
      'downgrade_applied', v_apply_downgrade,
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
   * Expira os créditos restantes do ciclo anterior.
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
        v_current_plan.name
      ),
      v_payment_id,
      jsonb_build_object(
        'source', 'pagarme_webhook',
        'credit_type', 'plan',
        'grant_type', 'subscription_cycle_expiration',
        'subscription_id', v_subscription.id,
        'plan_id', v_current_plan.id,
        'plan_name', v_current_plan.name,
        'previous_period_start', v_subscription.current_period_start,
        'previous_period_end', v_subscription.current_period_end
      )
    );
  end if;

  /*
   * Libera os créditos do novo ciclo.
   */
  if v_effective_plan.credits_included > 0 then
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
      v_effective_plan.credits_included,
      format(
        'Liberação de %s crédito(s) pela renovação do plano %s.',
        v_effective_plan.credits_included,
        v_effective_plan.name
      ),
      v_payment_id,
      jsonb_build_object(
        'source', 'pagarme_webhook',
        'credit_type', 'plan',
        'grant_type', 'subscription_renewal_cycle',
        'subscription_id', v_subscription.id,
        'plan_id', v_effective_plan.id,
        'plan_name', v_effective_plan.name,
        'period_start', p_period_start,
        'period_end', p_period_end,
        'next_billing_at', p_next_billing_at,
        'downgrade_applied', v_apply_downgrade
      )
    );
  end if;

  /*
   * Atualiza o ciclo, a próxima cobrança e, quando
   * necessário, aplica o downgrade pendente.
   */
  update public.subscriptions
  set
    plan_id = v_effective_plan.id,
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
        'previous_plan_id', v_current_plan.id,
        'effective_plan_id', v_effective_plan.id,
        'downgrade_applied', v_apply_downgrade,
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
    'previous_plan_id', v_current_plan.id,
    'effective_plan_id', v_effective_plan.id,
    'downgrade_applied', v_apply_downgrade,
    'expired_credits', v_plan_balance,
    'granted_credits', v_effective_plan.credits_included,
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


--
-- Name: process_scheduled_subscription_cancellations(timestamp with time zone); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.process_scheduled_subscription_cancellations(p_reference_at timestamp with time zone DEFAULT now()) RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$declare
  v_subscription record;
  v_remaining_plan_credits integer;
  v_processed_count integer := 0;
begin
  for v_subscription in
    select
      s.id,
      s.user_id,
      s.plan_id,
      s.external_id,
      s.cancellation_effective_at
    from public.subscriptions s
    where s.status = 'active'
      and s.cancel_at_period_end = true
      and s.cancellation_effective_at is not null
      and s.cancellation_effective_at <= p_reference_at
    order by s.cancellation_effective_at asc
    for update skip locked
  loop
    select
      coalesce(sc.plan_credits, 0)
    into
      v_remaining_plan_credits
    from public.student_credits sc
    where sc.user_id = v_subscription.user_id
    for update;

    v_remaining_plan_credits :=
      coalesce(v_remaining_plan_credits, 0);

    if v_remaining_plan_credits > 0 then
      insert into public.credit_transactions (
        user_id,
        type,
        amount,
        description,
        metadata
      )
      values (
        v_subscription.user_id,
        'plan_expiration',
        -v_remaining_plan_credits,
        format(
          'Expiração de %s crédito(s) após o encerramento da assinatura.',
          v_remaining_plan_credits
        ),
        jsonb_build_object(
          'source',
          'scheduled_subscription_cancellation',
          'credit_type',
          'plan',
          'plan_source',
          'subscription',
          'subscription_id',
          v_subscription.id,
          'plan_id',
          v_subscription.plan_id,
          'provider_subscription_id',
          v_subscription.external_id,
          'cancellation_effective_at',
          v_subscription.cancellation_effective_at,
          'processed_at',
          p_reference_at
        )
      );
    end if;

    update public.subscriptions
    set
      status = 'canceled',
      cancel_at_period_end = false,
      canceled_at = coalesce(
        canceled_at,
        cancellation_effective_at,
        p_reference_at
      ),
      metadata =
  coalesce(
    metadata,
    '{}'::jsonb
  )
  ||
  jsonb_build_object(
    'cancellation_state',
      'finalized',

    'cancellation_finalized_at',
      p_reference_at,

    'cancellation_finalization_source',
      'scheduled_job',

    'credits_expired_on_cancellation',
      greatest(
        v_remaining_plan_credits,
        0
      )
  ),
      cancellation_metadata =
        coalesce(
          cancellation_metadata,
          '{}'::jsonb
        )
        ||
        jsonb_build_object(
          'completion_source',
          'scheduled_job',
          'completed_at',
          p_reference_at,
          'expired_plan_credits',
          greatest(
            v_remaining_plan_credits,
            0
          )
        ),
      updated_at = p_reference_at
    where id = v_subscription.id;

    v_processed_count :=
      v_processed_count + 1;
  end loop;

  return v_processed_count;
end;$$;


--
-- Name: return_essay_to_student(uuid, text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.return_essay_to_student(p_essay_id uuid, p_reason text, p_description text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare
  v_student_id uuid;
  v_current_status text;

  v_used_credit_type text;
  v_plan_source text;

  /*
   * Crédito gratuito.
   */
  v_free_allocation_id uuid;
  v_free_allocation_expires_at timestamptz;
  v_free_allocation_status text;
  v_free_refund_expires_at timestamptz;

  /*
   * Créditos da Mentoria.
   */
  v_original_mentorship_allocation_id uuid;
  v_refund_mentorship_allocation_id uuid;
  v_refund_cycle_number smallint;

  v_original_allocation_expires_at timestamptz;
  v_original_allocation_status text;

  v_refund_mode text;
  v_refund_metadata jsonb;
begin
  /*
   * 1. Localiza e trava a redação.
   */
  select
    essay.student_id,
    essay.status
  into
    v_student_id,
    v_current_status
  from public.essays as essay
  where essay.id = p_essay_id
  for update;

  if not found then
    raise exception 'Redação não encontrada.';
  end if;

  if v_current_status not in (
    'pending',
    'correcting'
  ) then
    raise exception
      'Apenas redações na fila podem ser devolvidas. Status atual: %',
      v_current_status;
  end if;

  /*
   * 2. Identifica a origem do crédito utilizado.
   */
  select
    ct.metadata ->> 'credit_type',

    ct.metadata ->> 'plan_source',

    nullif(
      ct.metadata ->> 'mentorship_allocation_id',
      ''
    )::uuid,

    nullif(
      ct.metadata ->> 'free_credit_allocation_id',
      ''
    )::uuid

  into
    v_used_credit_type,
    v_plan_source,
    v_original_mentorship_allocation_id,
    v_free_allocation_id

  from public.credit_transactions as ct
  where ct.type = 'essay_usage'
    and ct.metadata ->> 'essay_id' =
      p_essay_id::text
  order by ct.created_at desc
  limit 1;

  /*
   * Compatibilidade com redações antigas.
   */
  if v_used_credit_type is null then
    v_used_credit_type := 'plan';
  end if;

  /*
   * 3. Trata devolução de crédito gratuito.
   */
  if v_used_credit_type = 'free' then
    if v_free_allocation_id is null then
      raise exception
        'A origem do crédito gratuito não foi encontrada.';
    end if;

    select
      allocation.expires_at,
      allocation.status
    into
      v_free_allocation_expires_at,
      v_free_allocation_status
    from public.free_credit_allocations
      as allocation
    where allocation.id =
      v_free_allocation_id
      and allocation.user_id =
        v_student_id
    for update;

    if not found then
      raise exception
        'A alocação do crédito gratuito não foi encontrada.';
    end if;

    /*
     * Ainda está dentro da validade:
     * devolve para a mesma alocação e preserva
     * a data original.
     */
    if v_free_allocation_expires_at > now()
      and v_free_allocation_status in (
        'active',
        'consumed'
      )
    then
      update public.free_credit_allocations
      set
        remaining_amount =
          remaining_amount + 1,

        status = 'active',

        updated_at = now()

      where id = v_free_allocation_id
        and remaining_amount < amount;

      if not found then
        raise exception
          'Não foi possível devolver o crédito gratuito.';
      end if;

      v_refund_mode :=
        'same_free_allocation';

    else
      /*
       * A validade original terminou:
       * concede uma nova validade de 15 dias.
       */
      v_free_refund_expires_at :=
        (
          (
            timezone(
              'America/Sao_Paulo',
              now()
            )::date
            + 15
          )
          + time '23:59:59.999999'
        ) at time zone
          'America/Sao_Paulo';

      update public.free_credit_allocations
      set
        remaining_amount = 1,

        status = 'active',

        expires_at =
          v_free_refund_expires_at,

        updated_at = now()

      where id = v_free_allocation_id;

      if not found then
        raise exception
          'Não foi possível renovar o crédito gratuito devolvido.';
      end if;

      v_refund_mode :=
        'free_credit_renewed_after_expiration';
    end if;

  /*
   * 4. Trata devoluções de créditos da Mentoria.
   */
  elsif v_used_credit_type = 'plan'
    and v_plan_source = 'mentorship'
    and v_original_mentorship_allocation_id
      is not null
  then
    select
      allocation.expires_at,
      allocation.status,
      allocation.cycle_number
    into
      v_original_allocation_expires_at,
      v_original_allocation_status,
      v_refund_cycle_number
    from public.mentorship_credit_allocations
      as allocation
    where allocation.id =
      v_original_mentorship_allocation_id
      and allocation.user_id =
        v_student_id
    for update;

    /*
     * O lote original ainda está válido.
     */
    if found
      and v_original_allocation_expires_at
        > now()
      and v_original_allocation_status in (
        'active',
        'consumed'
      )
    then
      update public.mentorship_credit_allocations
      set
        remaining_amount =
          remaining_amount + 1,

        status = 'active',

        updated_at = now()

      where id =
        v_original_mentorship_allocation_id;

      v_refund_mentorship_allocation_id :=
        v_original_mentorship_allocation_id;

      v_refund_mode :=
        'same_allocation';

    else
      /*
       * Procura o ciclo atual da Mentoria.
       */
      select
        allocation.id,
        allocation.cycle_number
      into
        v_refund_mentorship_allocation_id,
        v_refund_cycle_number
      from public.mentorship_credit_allocations
        as allocation
      where allocation.user_id =
          v_student_id
        and allocation.status in (
          'active',
          'consumed'
        )
        and allocation.available_at <= now()
        and allocation.expires_at > now()
      order by
        allocation.expires_at asc,
        allocation.cycle_number asc
      limit 1
      for update;

      if
        v_refund_mentorship_allocation_id
          is not null
      then
        update public.mentorship_credit_allocations
        set
          remaining_amount =
            remaining_amount + 1,

          compensatory_refunds =
            compensatory_refunds + 1,

          status = 'active',

          updated_at = now()

        where id =
          v_refund_mentorship_allocation_id;

        v_refund_mode :=
          'current_cycle_compensation';

      else
        v_refund_mode :=
          'post_mentorship_compensation';
      end if;
    end if;
  end if;

  /*
   * 5. Atualiza a redação.
   */
  update public.essays
  set
    status = 'returned',

    return_reason = p_reason,

    return_description = p_description,

    updated_at = now()

  where id = p_essay_id;

  /*
   * 6. Prepara os metadados do estorno.
   */
  v_refund_metadata :=
    jsonb_strip_nulls(
      jsonb_build_object(
        'essay_id',
        p_essay_id,

        'credit_type',
        v_used_credit_type,

        'return_reason',
        p_reason,

        'credit_source',
        case
          when v_used_credit_type = 'free'
            then 'free_trial'
          else null
        end,

        'free_credit_allocation_id',
        v_free_allocation_id,

        'free_credit_expires_at',
        case
          when v_refund_mode =
            'free_credit_renewed_after_expiration'
          then v_free_refund_expires_at
          else v_free_allocation_expires_at
        end,

        'plan_source',
        case
          when v_plan_source = 'mentorship'
            then 'mentorship'
          else null
        end,

        'original_mentorship_allocation_id',
        v_original_mentorship_allocation_id,

        'refund_mentorship_allocation_id',
        v_refund_mentorship_allocation_id,

        'mentorship_cycle_number',
        v_refund_cycle_number,

        'refund_mode',
        v_refund_mode
      )
    );

  /*
   * 7. Registra o estorno.
   *
   * A trigger recalcula a carteira correta
   * usando credit_type.
   */
  insert into public.credit_transactions (
    user_id,
    type,
    amount,
    description,
    metadata
  )
  values (
    v_student_id,
    'essay_refund',
    1,
    'Estorno por redação devolvida',
    v_refund_metadata
  );
end;
$$;


--
-- Name: submit_essay(uuid, uuid, text, text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.submit_essay(p_student_id uuid, p_topic_id uuid, p_title text, p_thematic_axis text, p_content text) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
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
    status,
    due_date
  )
  values (
    p_student_id,
    p_topic_id,
    p_title,
    p_thematic_axis,
    p_content,
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


--
-- Name: update_student_credits_balance(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_student_credits_balance() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
declare
  v_user_id uuid;
  v_free_credits integer;
  v_plan_credits integer;
  v_extra_credits integer;
begin
  v_user_id := case
    when tg_op = 'DELETE' then old.user_id
    else new.user_id
  end;

  if v_user_id is null then
    if tg_op = 'DELETE' then
      return old;
    end if;

    return new;
  end if;

  /*
   * Não recria o saldo durante a exclusão
   * em cascata do usuário.
   */
  if not exists (
    select 1
    from public.profiles
    where id = v_user_id
  ) then
    if tg_op = 'DELETE' then
      return old;
    end if;

    return new;
  end if;

  select
    /*
     * Créditos gratuitos.
     */
    coalesce(
      sum(
        case
          when type::text = 'free_credit_expiration'
          then amount

          when type::text in (
            'free_trial_grant',
            'essay_usage',
            'essay_refund',
            'administrative_adjustment'
          )
          and metadata ->> 'credit_type' = 'free'
          then amount

          else 0
        end
      ),
      0
    )::integer,

    /*
     * Créditos de assinatura paga.
     *
     * Créditos da mentoria não entram neste saldo,
     * pois são controlados separadamente em
     * mentorship_credit_allocations.
     */
    coalesce(
      sum(
        case
          when type::text in (
            'plan_renewal',
            'plan_change',
            'new_subscription',
            'subscription_reactivation',
            'plan_expiration'
          )
          then amount

          /*
           * Mantém compatibilidade com movimentações
           * antigas de plano, mas exclui qualquer
           * transação originada da mentoria.
           */
          when type::text in (
            'free_trial_grant',
            'essay_usage',
            'essay_refund',
            'administrative_adjustment'
          )
          and coalesce(
            metadata ->> 'credit_type',
            'plan'
          ) = 'plan'
          and coalesce(
            metadata ->> 'plan_source',
            ''
          ) <> 'mentorship'
          and metadata ->> 'mentorship_allocation_id'
            is null
          then amount

          else 0
        end
      ),
      0
    )::integer,

    /*
     * Créditos adicionais comprados.
     */
    coalesce(
      sum(
        case
          when type::text = 'standalone_purchase'
          then amount

          when type::text in (
            'essay_usage',
            'essay_refund',
            'administrative_adjustment'
          )
          and metadata ->> 'credit_type' = 'extra'
          then amount

          else 0
        end
      ),
      0
    )::integer

  into
    v_free_credits,
    v_plan_credits,
    v_extra_credits

  from public.credit_transactions
  where user_id = v_user_id;

  insert into public.student_credits (
    user_id,
    free_credits,
    plan_credits,
    extra_credits,
    updated_at
  )
  values (
    v_user_id,
    v_free_credits,
    v_plan_credits,
    v_extra_credits,
    now()
  )
  on conflict (user_id)
  do update set
    free_credits = excluded.free_credits,
    plan_credits = excluded.plan_credits,
    extra_credits = excluded.extra_credits,
    updated_at = excluded.updated_at;

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;


--
-- Name: correction_drafts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.correction_drafts (
    essay_id uuid NOT NULL,
    teacher_id uuid NOT NULL,
    payload jsonb NOT NULL,
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: credit_transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.credit_transactions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    type public.transaction_type NOT NULL,
    amount integer NOT NULL,
    description text NOT NULL,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now(),
    student_payment_id uuid
);


--
-- Name: essay_backups; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.essay_backups (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    theme_id uuid NOT NULL,
    content text,
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: essays; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.essays (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    student_id uuid NOT NULL,
    title text NOT NULL,
    thematic_axis text NOT NULL,
    content text NOT NULL,
    submission_date timestamp with time zone DEFAULT now(),
    status text DEFAULT 'pending'::text,
    credit_cost integer DEFAULT 1 NOT NULL,
    teacher_id uuid,
    correction_date timestamp with time zone,
    general_comment text,
    score_c1 integer DEFAULT 0,
    score_c2 integer DEFAULT 0,
    score_c3 integer DEFAULT 0,
    score_c4 integer DEFAULT 0,
    score_c5 integer DEFAULT 0,
    total_score integer GENERATED ALWAYS AS (((((score_c1 + score_c2) + score_c3) + score_c4) + score_c5)) STORED,
    comment_c1 text,
    comment_c2 text,
    comment_c3 text,
    comment_c4 text,
    comment_c5 text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    topic_id uuid NOT NULL,
    highlights jsonb DEFAULT '[]'::jsonb,
    due_date timestamp with time zone,
    started_correction_at timestamp with time zone,
    payment_id uuid,
    return_reason text,
    return_description text,
    main_bottleneck text,
    next_essay_priorities text[] DEFAULT '{}'::text[] NOT NULL,
    rewrite_tasks text[] DEFAULT '{}'::text[] NOT NULL,
    CONSTRAINT essays_score_c1_check CHECK (((score_c1 >= 0) AND (score_c1 <= 200))),
    CONSTRAINT essays_score_c2_check CHECK (((score_c2 >= 0) AND (score_c2 <= 200))),
    CONSTRAINT essays_score_c3_check CHECK (((score_c3 >= 0) AND (score_c3 <= 200))),
    CONSTRAINT essays_score_c4_check CHECK (((score_c4 >= 0) AND (score_c4 <= 200))),
    CONSTRAINT essays_score_c5_check CHECK (((score_c5 >= 0) AND (score_c5 <= 200))),
    CONSTRAINT essays_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'pending'::text, 'correcting'::text, 'corrected'::text, 'returned'::text])))
);


--
-- Name: COLUMN essays.main_bottleneck; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.essays.main_bottleneck IS 'Principal problema identificado pelo corretor na redação.';


--
-- Name: COLUMN essays.next_essay_priorities; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.essays.next_essay_priorities IS 'Lista com três prioridades para a próxima redação do aluno.';


--
-- Name: COLUMN essays.rewrite_tasks; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.essays.rewrite_tasks IS 'Lista com uma a três tarefas de reescrita da redação atual.';


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    email text NOT NULL,
    full_name text,
    role public.app_role DEFAULT 'STUDENT'::public.app_role,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    avatar_url text,
    document character varying(11),
    phone character varying(20) NOT NULL,
    terms_accepted_at timestamp with time zone,
    onboarding_completed boolean,
    pagarme_customer_id character varying(100),
    phone_country_code character varying(4) DEFAULT '55'::character varying NOT NULL,
    acquisition_channel text DEFAULT 'ORGANIC'::text NOT NULL,
    CONSTRAINT check_document_is_numeric CHECK (((document)::text ~ '^[0-9]+$'::text)),
    CONSTRAINT check_phone_country_code_is_numeric CHECK (((phone_country_code)::text ~ '^[0-9]+$'::text)),
    CONSTRAINT check_phone_is_numeric CHECK (((phone)::text ~ '^[0-9]+$'::text)),
    CONSTRAINT profiles_acquisition_channel_check CHECK ((acquisition_channel = ANY (ARRAY['ORGANIC'::text, 'HOTMART_MENTORIA'::text]))),
    CONSTRAINT profiles_status_check CHECK ((status = ANY (ARRAY['active'::text, 'inactive'::text, 'blocked'::text])))
);


--
-- Name: essays_with_delivery; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.essays_with_delivery WITH (security_invoker='on') AS
 SELECT e.id,
    e.student_id,
    e.title,
    e.thematic_axis,
    e.content,
    e.submission_date,
    e.status,
    e.credit_cost,
    e.teacher_id,
    e.correction_date,
    e.general_comment,
    e.score_c1,
    e.score_c2,
    e.score_c3,
    e.score_c4,
    e.score_c5,
    e.total_score,
    e.comment_c1,
    e.comment_c2,
    e.comment_c3,
    e.comment_c4,
    e.comment_c5,
    e.created_at,
    e.updated_at,
    e.topic_id,
    e.highlights,
    e.due_date,
    e.started_correction_at,
    COALESCE((e.correction_date > e.due_date), false) AS is_on_late,
    p.full_name AS student_name,
    p.email AS student_email,
    p.avatar_url AS student_avatar
   FROM (public.essays e
     LEFT JOIN public.profiles p ON ((e.student_id = p.id)))
  WHERE (e.status = ANY (ARRAY['corrected'::text, 'correcting'::text]));


--
-- Name: free_credit_allocations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.free_credit_allocations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    subscription_id uuid,
    amount integer DEFAULT 1 NOT NULL,
    remaining_amount integer DEFAULT 1 NOT NULL,
    granted_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    grant_transaction_id uuid,
    expiration_transaction_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT free_credit_allocations_amount_check CHECK ((amount > 0)),
    CONSTRAINT free_credit_allocations_expiration_check CHECK ((expires_at > granted_at)),
    CONSTRAINT free_credit_allocations_remaining_check CHECK (((remaining_amount >= 0) AND (remaining_amount <= amount))),
    CONSTRAINT free_credit_allocations_status_check CHECK ((status = ANY (ARRAY['active'::text, 'consumed'::text, 'expired'::text])))
);


--
-- Name: holidays; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.holidays (
    date date NOT NULL,
    name text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: hotmart_invites; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hotmart_invites (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email text NOT NULL,
    token uuid DEFAULT gen_random_uuid(),
    used_at timestamp with time zone,
    transaction_id text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: hotmart_mentorship_accesses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hotmart_mentorship_accesses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    webhook_event_id uuid NOT NULL,
    transaction_id text NOT NULL,
    product_ucode text NOT NULL,
    product_name text,
    buyer_email text NOT NULL,
    buyer_name text,
    buyer_document text,
    buyer_document_type text,
    buyer_phone text,
    buyer_phone_code text,
    purchase_status text NOT NULL,
    approved_at timestamp with time zone,
    payment_type text,
    acquisition_channel text DEFAULT 'HOTMART_MENTORIA'::text NOT NULL,
    signup_token uuid DEFAULT gen_random_uuid() NOT NULL,
    signup_email_sent_at timestamp with time zone,
    claimed_at timestamp with time zone,
    claimed_user_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: hotmart_webhook_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hotmart_webhook_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    hotmart_event_id text NOT NULL,
    event text NOT NULL,
    version text,
    product_id bigint,
    product_ucode text,
    product_name text,
    transaction_id text,
    buyer_email text,
    buyer_name text,
    buyer_document text,
    buyer_document_type text,
    buyer_phone text,
    buyer_phone_code text,
    purchase_status text,
    payment_type text,
    approved_at timestamp with time zone,
    payload jsonb NOT NULL,
    processed_at timestamp with time zone,
    processing_error text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: invoices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.invoices (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    subscription_id uuid,
    user_id uuid NOT NULL,
    external_id character varying(100) NOT NULL,
    amount integer NOT NULL,
    status character varying(50) NOT NULL,
    payment_method character varying(50),
    url text,
    pdf text,
    paid_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: mentorship_credit_allocations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mentorship_credit_allocations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    mentorship_access_id uuid NOT NULL,
    subscription_id uuid NOT NULL,
    user_id uuid NOT NULL,
    cycle_number smallint NOT NULL,
    amount integer NOT NULL,
    remaining_amount integer DEFAULT 0 NOT NULL,
    available_at timestamp with time zone NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    released_at timestamp with time zone,
    expired_at timestamp with time zone,
    status text DEFAULT 'scheduled'::text NOT NULL,
    grant_transaction_id uuid,
    expiration_transaction_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    compensatory_refunds integer DEFAULT 0 NOT NULL,
    CONSTRAINT mentorship_credit_allocations_amount_check CHECK ((amount > 0)),
    CONSTRAINT mentorship_credit_allocations_compensatory_refunds_check CHECK ((compensatory_refunds >= 0)),
    CONSTRAINT mentorship_credit_allocations_cycle_check CHECK (((cycle_number >= 1) AND (cycle_number <= 3))),
    CONSTRAINT mentorship_credit_allocations_dates_check CHECK ((expires_at > available_at)),
    CONSTRAINT mentorship_credit_allocations_remaining_check CHECK (((remaining_amount >= 0) AND (remaining_amount <= (amount + compensatory_refunds)))),
    CONSTRAINT mentorship_credit_allocations_status_check CHECK ((status = ANY (ARRAY['scheduled'::text, 'active'::text, 'consumed'::text, 'expired'::text])))
);


--
-- Name: motivational_texts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.motivational_texts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    topic_id uuid,
    text_number integer DEFAULT 1,
    body_text text,
    image_url text,
    source_reference text,
    CONSTRAINT content_check CHECK (((body_text IS NOT NULL) OR (image_url IS NOT NULL)))
);


--
-- Name: pagarme_webhook_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pagarme_webhook_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    external_id text NOT NULL,
    event_type text NOT NULL,
    status text DEFAULT 'received'::text NOT NULL,
    payload jsonb NOT NULL,
    processed_at timestamp with time zone,
    error_message text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT pagarme_webhook_events_status_check CHECK ((status = ANY (ARRAY['received'::text, 'processing'::text, 'processed'::text, 'ignored'::text, 'failed'::text])))
);


--
-- Name: plans; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.plans (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    external_id character varying(100),
    credits_included integer NOT NULL,
    price integer NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    features text[],
    trial_days integer DEFAULT 0 NOT NULL,
    "interval" character varying(20) NOT NULL,
    interval_count integer,
    payment_methods text[] DEFAULT ARRAY['credit_card'::text, 'debit_card'::text, 'boleto'::text] NOT NULL,
    statement_descriptor character varying(13),
    is_public boolean DEFAULT true NOT NULL,
    credits_expiration_days integer DEFAULT 30 NOT NULL
);


--
-- Name: student_credits; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.student_credits (
    user_id uuid NOT NULL,
    plan_credits integer DEFAULT 0 NOT NULL,
    extra_credits integer DEFAULT 0 NOT NULL,
    updated_at timestamp with time zone DEFAULT now(),
    free_credits integer DEFAULT 0 NOT NULL,
    CONSTRAINT student_credits_free_credits_check CHECK ((free_credits >= 0))
);


--
-- Name: student_details; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.student_details (
    id uuid NOT NULL,
    education_level character varying(50) NOT NULL,
    school_type character varying(20) NOT NULL,
    desired_course character varying(100),
    state character varying(2) NOT NULL,
    city character varying(100) NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: student_payment_cards; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.student_payment_cards (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    pagarme_card_id character varying(100) NOT NULL,
    brand character varying(40),
    last_four_digits character varying(4) NOT NULL,
    holder_name character varying(64),
    exp_month integer NOT NULL,
    exp_year integer NOT NULL,
    is_default boolean DEFAULT false NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    deleted_at timestamp with time zone,
    CONSTRAINT student_payment_cards_exp_month_check CHECK (((exp_month >= 1) AND (exp_month <= 12))),
    CONSTRAINT student_payment_cards_exp_year_check CHECK (((exp_year >= 2024) AND (exp_year <= 2100))),
    CONSTRAINT student_payment_cards_last_four_digits_check CHECK (((last_four_digits)::text ~ '^[0-9]{4}$'::text))
);


--
-- Name: student_payments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.student_payments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    subscription_id uuid,
    plan_id uuid,
    payment_card_id uuid,
    kind character varying(30) NOT NULL,
    provider character varying(30) DEFAULT 'pagarme'::character varying NOT NULL,
    external_id character varying(100),
    amount integer NOT NULL,
    credits_amount integer,
    status character varying(50) NOT NULL,
    payment_method character varying(30) NOT NULL,
    boleto_url text,
    boleto_pdf text,
    boleto_barcode text,
    paid_at timestamp with time zone,
    due_at timestamp with time zone,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    idempotency_key character varying,
    CONSTRAINT student_payments_amount_check CHECK ((amount > 0)),
    CONSTRAINT student_payments_credits_amount_check CHECK (((credits_amount IS NULL) OR (credits_amount >= 0))),
    CONSTRAINT student_payments_kind_check CHECK (((kind)::text = ANY ((ARRAY['subscription'::character varying, 'extra_credits'::character varying, 'plan_upgrade_prorata'::character varying])::text[]))),
    CONSTRAINT student_payments_payment_method_check CHECK (((payment_method)::text = ANY ((ARRAY['credit_card'::character varying, 'debit_card'::character varying, 'boleto'::character varying])::text[])))
);


--
-- Name: student_performance_stats; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.student_performance_stats WITH (security_invoker='on') AS
 WITH last_essay AS (
         SELECT DISTINCT ON (essays.student_id) essays.student_id,
            essays.total_score AS last_score
           FROM public.essays
          WHERE (essays.status = 'corrected'::text)
          ORDER BY essays.student_id, essays.created_at DESC
        ), aggregated_stats AS (
         SELECT e.student_id,
            count(e.id) AS total_essays,
            (round(avg(e.total_score)))::integer AS average_total_score,
            (round(avg(e.score_c1)))::integer AS avg_c1,
            (round(avg(e.score_c2)))::integer AS avg_c2,
            (round(avg(e.score_c3)))::integer AS avg_c3,
            (round(avg(e.score_c4)))::integer AS avg_c4,
            (round(avg(e.score_c5)))::integer AS avg_c5,
            max(e.total_score) AS best_score,
            min(e.total_score) AS worst_score,
            count(e.id) FILTER (WHERE (e.created_at >= date_trunc('month'::text, (CURRENT_DATE)::timestamp with time zone))) AS current_month_essays,
            count(e.id) FILTER (WHERE ((e.created_at >= date_trunc('month'::text, (CURRENT_DATE - '1 mon'::interval))) AND (e.created_at < date_trunc('month'::text, (CURRENT_DATE)::timestamp with time zone)))) AS last_month_essays,
            (round(avg(e.total_score) FILTER (WHERE (e.created_at >= date_trunc('month'::text, (CURRENT_DATE)::timestamp with time zone)))))::integer AS current_month_avg,
            (round(avg(e.total_score) FILTER (WHERE ((e.created_at >= date_trunc('month'::text, (CURRENT_DATE - '1 mon'::interval))) AND (e.created_at < date_trunc('month'::text, (CURRENT_DATE)::timestamp with time zone))))))::integer AS last_month_avg,
            le.last_score
           FROM (public.essays e
             LEFT JOIN last_essay le ON ((e.student_id = le.student_id)))
          WHERE (e.status = 'corrected'::text)
          GROUP BY e.student_id, le.last_score
        )
 SELECT student_id,
    total_essays,
    average_total_score,
    avg_c1,
    avg_c2,
    avg_c3,
    avg_c4,
    avg_c5,
    best_score,
    worst_score,
    last_score,
        CASE
            WHEN ((GREATEST(avg_c1, avg_c2, avg_c3, avg_c4, avg_c5) = 0) OR (GREATEST(avg_c1, avg_c2, avg_c3, avg_c4, avg_c5) IS NULL)) THEN '-'::text
            WHEN (avg_c1 = GREATEST(avg_c1, avg_c2, avg_c3, avg_c4, avg_c5)) THEN 'C1'::text
            WHEN (avg_c2 = GREATEST(avg_c1, avg_c2, avg_c3, avg_c4, avg_c5)) THEN 'C2'::text
            WHEN (avg_c3 = GREATEST(avg_c1, avg_c2, avg_c3, avg_c4, avg_c5)) THEN 'C3'::text
            WHEN (avg_c4 = GREATEST(avg_c1, avg_c2, avg_c3, avg_c4, avg_c5)) THEN 'C4'::text
            ELSE 'C5'::text
        END AS best_competence,
    (COALESCE(current_month_essays, (0)::bigint) - COALESCE(last_month_essays, (0)::bigint)) AS essays_trend,
    (COALESCE(current_month_avg, 0) - COALESCE(last_month_avg, 0)) AS score_trend
   FROM aggregated_stats;


--
-- Name: subscription_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.subscription_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    subscription_id uuid,
    old_status text,
    new_status text,
    changed_at timestamp with time zone DEFAULT now(),
    change_type text,
    old_plan_id uuid,
    new_plan_id uuid,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    old_external_id text,
    new_external_id text
);


--
-- Name: subscriptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.subscriptions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    plan_id uuid NOT NULL,
    status public.subscription_status DEFAULT 'unpaid'::public.subscription_status NOT NULL,
    current_period_start timestamp with time zone,
    current_period_end timestamp with time zone,
    cancel_at_period_end boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    external_id character varying(100),
    payment_method character varying(30),
    payment_card_id uuid,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    cancellation_requested_at timestamp with time zone,
    cancellation_effective_at timestamp with time zone,
    cancellation_reason text,
    cancellation_provider_status text,
    provider_canceled_at timestamp with time zone,
    canceled_at timestamp with time zone,
    cancellation_metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    pending_plan_id uuid,
    pending_change_type text,
    pending_change_at timestamp with time zone,
    next_billing_at timestamp with time zone,
    CONSTRAINT subscriptions_payment_method_check CHECK (((payment_method IS NULL) OR ((payment_method)::text = ANY ((ARRAY['credit_card'::character varying, 'debit_card'::character varying, 'boleto'::character varying])::text[])))),
    CONSTRAINT subscriptions_pending_change_consistency_check CHECK ((((pending_plan_id IS NULL) AND (pending_change_type IS NULL) AND (pending_change_at IS NULL)) OR ((pending_plan_id IS NOT NULL) AND (pending_change_type = 'downgrade'::text) AND (pending_change_at IS NOT NULL)))),
    CONSTRAINT subscriptions_pending_change_type_check CHECK (((pending_change_type IS NULL) OR (pending_change_type = 'downgrade'::text)))
);


--
-- Name: teacher_payment_accounts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.teacher_payment_accounts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    teacher_id uuid NOT NULL,
    type text NOT NULL,
    owner_name text NOT NULL,
    owner_document text NOT NULL,
    is_default boolean DEFAULT false,
    pix_type text,
    pix_key text,
    bank_name text,
    agency text,
    account_number text,
    account_variant text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT teacher_payment_accounts_account_variant_check CHECK ((account_variant = ANY (ARRAY['corrente'::text, 'poupanca'::text]))),
    CONSTRAINT teacher_payment_accounts_pix_type_check CHECK ((pix_type = ANY (ARRAY['cpf'::text, 'cnpj'::text, 'phone'::text, 'email'::text, 'random'::text]))),
    CONSTRAINT teacher_payment_accounts_type_check CHECK ((type = ANY (ARRAY['pix'::text, 'bank_account'::text])))
);


--
-- Name: teacher_payments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.teacher_payments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    teacher_id uuid NOT NULL,
    billing_month date NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    total_amount numeric(10,2) NOT NULL,
    essays_count integer NOT NULL,
    unit_value numeric(10,2) NOT NULL,
    receipt_url text,
    processed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    metadata jsonb DEFAULT '{}'::jsonb,
    CONSTRAINT teacher_payments_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'paid'::text, 'processing'::text, 'cancelled'::text, 'refunded'::text])))
);


--
-- Name: teacher_stats_view; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.teacher_stats_view WITH (security_invoker='on') AS
 SELECT p.id,
    p.full_name,
    p.email,
    p.status,
    p.avatar_url,
    (count(e.id))::integer AS total,
    (count(e.id) FILTER (WHERE (e.created_at >= date_trunc('month'::text, timezone('utc'::text, now())))))::integer AS "currentMonth"
   FROM (public.profiles p
     LEFT JOIN public.essays e ON (((p.id = e.teacher_id) AND (e.status = 'done'::text))))
  WHERE (p.role = 'TEACHER'::public.app_role)
  GROUP BY p.id, p.full_name, p.email, p.status, p.avatar_url;


--
-- Name: vw_admin_essays; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.vw_admin_essays WITH (security_invoker='on') AS
 SELECT e.id,
    e.title,
    e.thematic_axis,
    e.created_at,
    e.due_date,
    e.status,
    e.submission_date,
    e.total_score,
    e.correction_date,
    s.full_name AS student_name,
    s.avatar_url,
    s.email,
    t.full_name AS teacher_name
   FROM ((public.essays e
     LEFT JOIN public.profiles s ON ((e.student_id = s.id)))
     LEFT JOIN public.profiles t ON ((e.teacher_id = t.id)));


--
-- Name: vw_teacher_essays; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.vw_teacher_essays WITH (security_invoker='true') AS
 SELECT e.id,
    e.title,
    e.thematic_axis,
    e.correction_date,
    e.total_score,
    e.teacher_id,
    e.status,
    e.created_at,
    e.due_date,
    p.full_name AS student_name,
    p.avatar_url,
    p.email
   FROM (public.essays e
     JOIN public.profiles p ON ((e.student_id = p.id)));


--
-- Name: weekly_student_ranking; Type: MATERIALIZED VIEW; Schema: public; Owner: -
--

CREATE MATERIALIZED VIEW public.weekly_student_ranking AS
 WITH aggregated_stats AS (
         SELECT e.student_id,
            count(e.id) AS total_essays,
            (round(avg(e.total_score)))::integer AS average_total_score,
            count(e.id) FILTER (WHERE (e.created_at < date_trunc('month'::text, (CURRENT_DATE)::timestamp with time zone))) AS total_essays_until_last_month,
            (round(avg(e.total_score) FILTER (WHERE (e.created_at < date_trunc('month'::text, (CURRENT_DATE)::timestamp with time zone)))))::integer AS avg_score_until_last_month
           FROM public.essays e
          WHERE (e.status = 'corrected'::text)
          GROUP BY e.student_id
        )
 SELECT student_id,
    rank() OVER (ORDER BY average_total_score DESC NULLS LAST, total_essays DESC) AS ranking_position,
    (rank() OVER (ORDER BY avg_score_until_last_month DESC NULLS LAST, total_essays_until_last_month DESC) - rank() OVER (ORDER BY average_total_score DESC NULLS LAST, total_essays DESC)) AS ranking_trend
   FROM aggregated_stats
  WITH NO DATA;


--
-- Name: correction_drafts correction_drafts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.correction_drafts
    ADD CONSTRAINT correction_drafts_pkey PRIMARY KEY (essay_id);


--
-- Name: credit_transactions credit_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.credit_transactions
    ADD CONSTRAINT credit_transactions_pkey PRIMARY KEY (id);


--
-- Name: essay_backups essay_backups_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.essay_backups
    ADD CONSTRAINT essay_backups_pkey PRIMARY KEY (id);


--
-- Name: essay_backups essay_backups_user_theme_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.essay_backups
    ADD CONSTRAINT essay_backups_user_theme_unique UNIQUE (user_id, theme_id);


--
-- Name: essay_topics essay_topics_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.essay_topics
    ADD CONSTRAINT essay_topics_pkey PRIMARY KEY (id);


--
-- Name: essays essays_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.essays
    ADD CONSTRAINT essays_pkey PRIMARY KEY (id);


--
-- Name: free_credit_allocations free_credit_allocations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.free_credit_allocations
    ADD CONSTRAINT free_credit_allocations_pkey PRIMARY KEY (id);


--
-- Name: free_credit_allocations free_credit_allocations_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.free_credit_allocations
    ADD CONSTRAINT free_credit_allocations_user_id_key UNIQUE (user_id);


--
-- Name: holidays holidays_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.holidays
    ADD CONSTRAINT holidays_pkey PRIMARY KEY (date);


--
-- Name: hotmart_invites hotmart_invites_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hotmart_invites
    ADD CONSTRAINT hotmart_invites_email_key UNIQUE (email);


--
-- Name: hotmart_invites hotmart_invites_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hotmart_invites
    ADD CONSTRAINT hotmart_invites_pkey PRIMARY KEY (id);


--
-- Name: hotmart_invites hotmart_invites_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hotmart_invites
    ADD CONSTRAINT hotmart_invites_token_key UNIQUE (token);


--
-- Name: hotmart_mentorship_accesses hotmart_mentorship_accesses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hotmart_mentorship_accesses
    ADD CONSTRAINT hotmart_mentorship_accesses_pkey PRIMARY KEY (id);


--
-- Name: hotmart_mentorship_accesses hotmart_mentorship_accesses_signup_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hotmart_mentorship_accesses
    ADD CONSTRAINT hotmart_mentorship_accesses_signup_token_key UNIQUE (signup_token);


--
-- Name: hotmart_mentorship_accesses hotmart_mentorship_accesses_transaction_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hotmart_mentorship_accesses
    ADD CONSTRAINT hotmart_mentorship_accesses_transaction_id_key UNIQUE (transaction_id);


--
-- Name: hotmart_webhook_events hotmart_webhook_events_hotmart_event_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hotmart_webhook_events
    ADD CONSTRAINT hotmart_webhook_events_hotmart_event_id_key UNIQUE (hotmart_event_id);


--
-- Name: hotmart_webhook_events hotmart_webhook_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hotmart_webhook_events
    ADD CONSTRAINT hotmart_webhook_events_pkey PRIMARY KEY (id);


--
-- Name: invoices invoices_external_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_external_id_key UNIQUE (external_id);


--
-- Name: invoices invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_pkey PRIMARY KEY (id);


--
-- Name: mentorship_credit_allocations mentorship_credit_allocations_access_cycle_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mentorship_credit_allocations
    ADD CONSTRAINT mentorship_credit_allocations_access_cycle_unique UNIQUE (mentorship_access_id, cycle_number);


--
-- Name: mentorship_credit_allocations mentorship_credit_allocations_expiration_transaction_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mentorship_credit_allocations
    ADD CONSTRAINT mentorship_credit_allocations_expiration_transaction_unique UNIQUE (expiration_transaction_id);


--
-- Name: mentorship_credit_allocations mentorship_credit_allocations_grant_transaction_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mentorship_credit_allocations
    ADD CONSTRAINT mentorship_credit_allocations_grant_transaction_unique UNIQUE (grant_transaction_id);


--
-- Name: mentorship_credit_allocations mentorship_credit_allocations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mentorship_credit_allocations
    ADD CONSTRAINT mentorship_credit_allocations_pkey PRIMARY KEY (id);


--
-- Name: motivational_texts motivational_texts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.motivational_texts
    ADD CONSTRAINT motivational_texts_pkey PRIMARY KEY (id);


--
-- Name: pagarme_webhook_events pagarme_webhook_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pagarme_webhook_events
    ADD CONSTRAINT pagarme_webhook_events_pkey PRIMARY KEY (id);


--
-- Name: plans plans_external_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.plans
    ADD CONSTRAINT plans_external_id_key UNIQUE (external_id);


--
-- Name: plans plans_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.plans
    ADD CONSTRAINT plans_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_document_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_document_key UNIQUE (document);


--
-- Name: profiles profiles_pagarme_customer_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pagarme_customer_id_key UNIQUE (pagarme_customer_id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: student_credits student_credits_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_credits
    ADD CONSTRAINT student_credits_pkey PRIMARY KEY (user_id);


--
-- Name: student_details student_details_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_details
    ADD CONSTRAINT student_details_pkey PRIMARY KEY (id);


--
-- Name: student_payment_cards student_payment_cards_pagarme_card_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_payment_cards
    ADD CONSTRAINT student_payment_cards_pagarme_card_id_key UNIQUE (pagarme_card_id);


--
-- Name: student_payment_cards student_payment_cards_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_payment_cards
    ADD CONSTRAINT student_payment_cards_pkey PRIMARY KEY (id);


--
-- Name: student_payments student_payments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_payments
    ADD CONSTRAINT student_payments_pkey PRIMARY KEY (id);


--
-- Name: subscription_history subscription_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscription_history
    ADD CONSTRAINT subscription_history_pkey PRIMARY KEY (id);


--
-- Name: subscriptions subscriptions_external_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_external_id_key UNIQUE (external_id);


--
-- Name: subscriptions subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_pkey PRIMARY KEY (id);


--
-- Name: teacher_payment_accounts teacher_payment_accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teacher_payment_accounts
    ADD CONSTRAINT teacher_payment_accounts_pkey PRIMARY KEY (id);


--
-- Name: teacher_payments teacher_payments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teacher_payments
    ADD CONSTRAINT teacher_payments_pkey PRIMARY KEY (id);


--
-- Name: teacher_payments unique_teacher_month; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teacher_payments
    ADD CONSTRAINT unique_teacher_month UNIQUE (teacher_id, billing_month);


--
-- Name: credit_transactions_payment_type_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX credit_transactions_payment_type_unique ON public.credit_transactions USING btree (student_payment_id, type) WHERE (student_payment_id IS NOT NULL);


--
-- Name: free_credit_allocations_expiration_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX free_credit_allocations_expiration_idx ON public.free_credit_allocations USING btree (expires_at) WHERE (status = 'active'::text);


--
-- Name: hotmart_mentorship_accesses_acquisition_channel_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX hotmart_mentorship_accesses_acquisition_channel_idx ON public.hotmart_mentorship_accesses USING btree (acquisition_channel);


--
-- Name: hotmart_mentorship_accesses_buyer_email_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX hotmart_mentorship_accesses_buyer_email_idx ON public.hotmart_mentorship_accesses USING btree (buyer_email);


--
-- Name: hotmart_mentorship_accesses_claimed_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX hotmart_mentorship_accesses_claimed_user_id_idx ON public.hotmart_mentorship_accesses USING btree (claimed_user_id);


--
-- Name: hotmart_mentorship_accesses_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX hotmart_mentorship_accesses_created_at_idx ON public.hotmart_mentorship_accesses USING btree (created_at DESC);


--
-- Name: hotmart_webhook_events_buyer_email_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX hotmart_webhook_events_buyer_email_idx ON public.hotmart_webhook_events USING btree (buyer_email);


--
-- Name: hotmart_webhook_events_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX hotmart_webhook_events_created_at_idx ON public.hotmart_webhook_events USING btree (created_at DESC);


--
-- Name: hotmart_webhook_events_product_ucode_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX hotmart_webhook_events_product_ucode_idx ON public.hotmart_webhook_events USING btree (product_ucode);


--
-- Name: hotmart_webhook_events_transaction_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX hotmart_webhook_events_transaction_id_idx ON public.hotmart_webhook_events USING btree (transaction_id);


--
-- Name: idx_credit_transactions_student_payment_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_credit_transactions_student_payment_id ON public.credit_transactions USING btree (student_payment_id);


--
-- Name: idx_essays_correction_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_essays_correction_date ON public.essays USING btree (correction_date);


--
-- Name: idx_essays_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_essays_created_at ON public.essays USING btree (created_at);


--
-- Name: idx_essays_due_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_essays_due_date ON public.essays USING btree (due_date);


--
-- Name: idx_essays_payment_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_essays_payment_id ON public.essays USING btree (payment_id);


--
-- Name: idx_essays_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_essays_status ON public.essays USING btree (status);


--
-- Name: idx_essays_student; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_essays_student ON public.essays USING btree (student_id);


--
-- Name: idx_essays_student_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_essays_student_id ON public.essays USING btree (student_id);


--
-- Name: idx_essays_submission_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_essays_submission_date ON public.essays USING btree (submission_date);


--
-- Name: idx_essays_teacher_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_essays_teacher_id ON public.essays USING btree (teacher_id);


--
-- Name: idx_holidays_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_holidays_date ON public.holidays USING btree (date);


--
-- Name: idx_invoices_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_invoices_status ON public.invoices USING btree (status);


--
-- Name: idx_invoices_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_invoices_user_id ON public.invoices USING btree (user_id);


--
-- Name: idx_mentorship_allocations_available; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_mentorship_allocations_available ON public.mentorship_credit_allocations USING btree (available_at) WHERE (status = 'scheduled'::text);


--
-- Name: idx_mentorship_allocations_due_expiration; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_mentorship_allocations_due_expiration ON public.mentorship_credit_allocations USING btree (expires_at) WHERE (status = ANY (ARRAY['scheduled'::text, 'active'::text, 'consumed'::text]));


--
-- Name: idx_mentorship_allocations_expires; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_mentorship_allocations_expires ON public.mentorship_credit_allocations USING btree (expires_at) WHERE (status = 'active'::text);


--
-- Name: idx_mentorship_allocations_subscription; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_mentorship_allocations_subscription ON public.mentorship_credit_allocations USING btree (subscription_id);


--
-- Name: idx_mentorship_allocations_user_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_mentorship_allocations_user_status ON public.mentorship_credit_allocations USING btree (user_id, status);


--
-- Name: idx_one_default_account_per_teacher; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_one_default_account_per_teacher ON public.teacher_payment_accounts USING btree (teacher_id) WHERE (is_default = true);


--
-- Name: idx_student_payment_cards_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_student_payment_cards_active ON public.student_payment_cards USING btree (user_id, is_active) WHERE (deleted_at IS NULL);


--
-- Name: idx_student_payment_cards_one_default; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_student_payment_cards_one_default ON public.student_payment_cards USING btree (user_id) WHERE ((is_default = true) AND (is_active = true) AND (deleted_at IS NULL));


--
-- Name: idx_student_payment_cards_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_student_payment_cards_user_id ON public.student_payment_cards USING btree (user_id);


--
-- Name: idx_student_payments_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_student_payments_created_at ON public.student_payments USING btree (created_at DESC);


--
-- Name: idx_student_payments_kind; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_student_payments_kind ON public.student_payments USING btree (kind);


--
-- Name: idx_student_payments_payment_card_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_student_payments_payment_card_id ON public.student_payments USING btree (payment_card_id);


--
-- Name: idx_student_payments_plan_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_student_payments_plan_id ON public.student_payments USING btree (plan_id);


--
-- Name: idx_student_payments_provider_external_id; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_student_payments_provider_external_id ON public.student_payments USING btree (provider, external_id) WHERE (external_id IS NOT NULL);


--
-- Name: idx_student_payments_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_student_payments_status ON public.student_payments USING btree (status);


--
-- Name: idx_student_payments_subscription_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_student_payments_subscription_id ON public.student_payments USING btree (subscription_id);


--
-- Name: idx_student_payments_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_student_payments_user_id ON public.student_payments USING btree (user_id);


--
-- Name: idx_subscriptions_payment_card_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_subscriptions_payment_card_id ON public.subscriptions USING btree (payment_card_id);


--
-- Name: idx_teacher_payments_teacher_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_teacher_payments_teacher_id ON public.teacher_payments USING btree (teacher_id);


--
-- Name: idx_transactions_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_transactions_created_at ON public.credit_transactions USING btree (created_at DESC);


--
-- Name: idx_transactions_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_transactions_user_id ON public.credit_transactions USING btree (user_id);


--
-- Name: idx_weekly_ranking_student_id; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_weekly_ranking_student_id ON public.weekly_student_ranking USING btree (student_id);


--
-- Name: pagarme_webhook_events_external_id_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX pagarme_webhook_events_external_id_unique ON public.pagarme_webhook_events USING btree (external_id);


--
-- Name: pagarme_webhook_events_type_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX pagarme_webhook_events_type_status_idx ON public.pagarme_webhook_events USING btree (event_type, status);


--
-- Name: student_payments_idempotency_key_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX student_payments_idempotency_key_unique ON public.student_payments USING btree (idempotency_key) WHERE (idempotency_key IS NOT NULL);


--
-- Name: student_payments_plan_upgrade_cycle_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX student_payments_plan_upgrade_cycle_unique ON public.student_payments USING btree (subscription_id, ((metadata ->> 'current_period_start'::text))) WHERE (((kind)::text = 'plan_upgrade_prorata'::text) AND ((status)::text = ANY ((ARRAY['processing'::character varying, 'pending'::character varying, 'paid'::character varying, 'active'::character varying])::text[])));


--
-- Name: subscriptions_pending_cancellation_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX subscriptions_pending_cancellation_idx ON public.subscriptions USING btree (cancellation_effective_at) WHERE ((cancel_at_period_end = true) AND (status = 'active'::public.subscription_status));


--
-- Name: subscriptions_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX subscriptions_user_id_idx ON public.subscriptions USING btree (user_id);


--
-- Name: subscriptions trigger_subscription_history; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_subscription_history AFTER INSERT OR UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.log_subscription_status_change();


--
-- Name: credit_transactions trigger_update_credits_balance; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_credits_balance AFTER INSERT OR DELETE OR UPDATE ON public.credit_transactions FOR EACH ROW EXECUTE FUNCTION public.update_student_credits_balance();


--
-- Name: correction_drafts correction_drafts_essay_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.correction_drafts
    ADD CONSTRAINT correction_drafts_essay_id_fkey FOREIGN KEY (essay_id) REFERENCES public.essays(id) ON DELETE CASCADE;


--
-- Name: correction_drafts correction_drafts_teacher_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.correction_drafts
    ADD CONSTRAINT correction_drafts_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.profiles(id);


--
-- Name: credit_transactions credit_transactions_student_payment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.credit_transactions
    ADD CONSTRAINT credit_transactions_student_payment_id_fkey FOREIGN KEY (student_payment_id) REFERENCES public.student_payments(id) ON DELETE SET NULL;


--
-- Name: credit_transactions credit_transactions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.credit_transactions
    ADD CONSTRAINT credit_transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: essay_backups essay_backups_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.essay_backups
    ADD CONSTRAINT essay_backups_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: essays essays_payment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.essays
    ADD CONSTRAINT essays_payment_id_fkey FOREIGN KEY (payment_id) REFERENCES public.teacher_payments(id);


--
-- Name: essays essays_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.essays
    ADD CONSTRAINT essays_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.profiles(id);


--
-- Name: essays essays_teacher_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.essays
    ADD CONSTRAINT essays_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.profiles(id);


--
-- Name: free_credit_allocations free_credit_allocations_expiration_transaction_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.free_credit_allocations
    ADD CONSTRAINT free_credit_allocations_expiration_transaction_id_fkey FOREIGN KEY (expiration_transaction_id) REFERENCES public.credit_transactions(id) ON DELETE SET NULL;


--
-- Name: free_credit_allocations free_credit_allocations_grant_transaction_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.free_credit_allocations
    ADD CONSTRAINT free_credit_allocations_grant_transaction_id_fkey FOREIGN KEY (grant_transaction_id) REFERENCES public.credit_transactions(id) ON DELETE SET NULL;


--
-- Name: free_credit_allocations free_credit_allocations_subscription_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.free_credit_allocations
    ADD CONSTRAINT free_credit_allocations_subscription_id_fkey FOREIGN KEY (subscription_id) REFERENCES public.subscriptions(id) ON DELETE SET NULL;


--
-- Name: free_credit_allocations free_credit_allocations_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.free_credit_allocations
    ADD CONSTRAINT free_credit_allocations_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: hotmart_mentorship_accesses hotmart_mentorship_accesses_claimed_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hotmart_mentorship_accesses
    ADD CONSTRAINT hotmart_mentorship_accesses_claimed_user_id_fkey FOREIGN KEY (claimed_user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: hotmart_mentorship_accesses hotmart_mentorship_accesses_webhook_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hotmart_mentorship_accesses
    ADD CONSTRAINT hotmart_mentorship_accesses_webhook_event_id_fkey FOREIGN KEY (webhook_event_id) REFERENCES public.hotmart_webhook_events(id) ON DELETE RESTRICT;


--
-- Name: invoices invoices_subscription_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_subscription_id_fkey FOREIGN KEY (subscription_id) REFERENCES public.subscriptions(id) ON DELETE SET NULL;


--
-- Name: invoices invoices_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: mentorship_credit_allocations mentorship_credit_allocations_expiration_transaction_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mentorship_credit_allocations
    ADD CONSTRAINT mentorship_credit_allocations_expiration_transaction_id_fkey FOREIGN KEY (expiration_transaction_id) REFERENCES public.credit_transactions(id) ON DELETE SET NULL;


--
-- Name: mentorship_credit_allocations mentorship_credit_allocations_grant_transaction_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mentorship_credit_allocations
    ADD CONSTRAINT mentorship_credit_allocations_grant_transaction_id_fkey FOREIGN KEY (grant_transaction_id) REFERENCES public.credit_transactions(id) ON DELETE SET NULL;


--
-- Name: mentorship_credit_allocations mentorship_credit_allocations_mentorship_access_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mentorship_credit_allocations
    ADD CONSTRAINT mentorship_credit_allocations_mentorship_access_id_fkey FOREIGN KEY (mentorship_access_id) REFERENCES public.hotmart_mentorship_accesses(id) ON DELETE RESTRICT;


--
-- Name: mentorship_credit_allocations mentorship_credit_allocations_subscription_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mentorship_credit_allocations
    ADD CONSTRAINT mentorship_credit_allocations_subscription_id_fkey FOREIGN KEY (subscription_id) REFERENCES public.subscriptions(id) ON DELETE RESTRICT;


--
-- Name: mentorship_credit_allocations mentorship_credit_allocations_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mentorship_credit_allocations
    ADD CONSTRAINT mentorship_credit_allocations_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: motivational_texts motivational_texts_topic_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.motivational_texts
    ADD CONSTRAINT motivational_texts_topic_id_fkey FOREIGN KEY (topic_id) REFERENCES public.essay_topics(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: student_credits student_credits_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_credits
    ADD CONSTRAINT student_credits_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: student_details student_details_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_details
    ADD CONSTRAINT student_details_id_fkey FOREIGN KEY (id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: student_payment_cards student_payment_cards_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_payment_cards
    ADD CONSTRAINT student_payment_cards_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: student_payments student_payments_payment_card_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_payments
    ADD CONSTRAINT student_payments_payment_card_id_fkey FOREIGN KEY (payment_card_id) REFERENCES public.student_payment_cards(id) ON DELETE SET NULL;


--
-- Name: student_payments student_payments_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_payments
    ADD CONSTRAINT student_payments_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.plans(id) ON DELETE SET NULL;


--
-- Name: student_payments student_payments_subscription_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_payments
    ADD CONSTRAINT student_payments_subscription_id_fkey FOREIGN KEY (subscription_id) REFERENCES public.subscriptions(id) ON DELETE SET NULL;


--
-- Name: student_payments student_payments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_payments
    ADD CONSTRAINT student_payments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: subscription_history subscription_history_new_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscription_history
    ADD CONSTRAINT subscription_history_new_plan_id_fkey FOREIGN KEY (new_plan_id) REFERENCES public.plans(id) ON DELETE SET NULL;


--
-- Name: subscription_history subscription_history_old_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscription_history
    ADD CONSTRAINT subscription_history_old_plan_id_fkey FOREIGN KEY (old_plan_id) REFERENCES public.plans(id) ON DELETE SET NULL;


--
-- Name: subscription_history subscription_history_subscription_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscription_history
    ADD CONSTRAINT subscription_history_subscription_id_fkey FOREIGN KEY (subscription_id) REFERENCES public.subscriptions(id) ON DELETE CASCADE;


--
-- Name: subscriptions subscriptions_payment_card_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_payment_card_id_fkey FOREIGN KEY (payment_card_id) REFERENCES public.student_payment_cards(id) ON DELETE SET NULL;


--
-- Name: subscriptions subscriptions_pending_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_pending_plan_id_fkey FOREIGN KEY (pending_plan_id) REFERENCES public.plans(id);


--
-- Name: subscriptions subscriptions_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.plans(id);


--
-- Name: subscriptions subscriptions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: teacher_payment_accounts teacher_payment_accounts_teacher_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teacher_payment_accounts
    ADD CONSTRAINT teacher_payment_accounts_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: teacher_payments teacher_payments_teacher_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teacher_payments
    ADD CONSTRAINT teacher_payments_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.profiles(id);


--
