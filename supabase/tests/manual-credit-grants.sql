-- Isolated disposable database only, after all migrations have been applied.
-- Runs every scenario, prints one result per scenario, and rolls back all data.
\set ON_ERROR_STOP on

begin;

create temporary table credit_grant_test_results (
  sequence integer generated always as identity,
  scenario text not null,
  passed boolean not null,
  details text
) on commit drop;

create function pg_temp.record_credit_grant_test(
  p_scenario text,
  p_passed boolean,
  p_details text default null
)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into pg_temp.credit_grant_test_results (scenario, passed, details)
  values (p_scenario, p_passed, p_details);
$$;

-- Fixtures bypass application triggers only while they are being assembled.
set local session_replication_role = replica;

insert into auth.users (id)
values
  ('19000000-0000-0000-0000-000000000001'),
  ('19000000-0000-0000-0000-000000000002'),
  ('19000000-0000-0000-0000-000000000003'),
  ('19000000-0000-0000-0000-000000000004'),
  ('19000000-0000-0000-0000-000000000005'),
  ('19000000-0000-0000-0000-000000000006');

insert into public.profiles (id, email, full_name, phone, document, role, status)
values
  ('19000000-0000-0000-0000-000000000001', 'grant-admin@example.com', 'Grant Admin',
    '11999999991', '12345678901', 'ADMIN', 'active'),
  ('19000000-0000-0000-0000-000000000002', 'grant-plan@example.com', 'Plan Student',
    '11999999992', '12345678902', 'STUDENT', 'active'),
  ('19000000-0000-0000-0000-000000000003', 'grant-mentorship@example.com', 'Mentorship Student',
    '11999999993', '12345678903', 'STUDENT', 'active'),
  ('19000000-0000-0000-0000-000000000004', 'grant-extra@example.com', 'Extra Student',
    '11999999994', '12345678904', 'STUDENT', 'active'),
  ('19000000-0000-0000-0000-000000000005', 'grant-blocked@example.com', 'Blocked Student',
    '11999999995', '12345678905', 'STUDENT', 'blocked'),
  ('19000000-0000-0000-0000-000000000006', 'grant-no-cycle@example.com', 'No Cycle Student',
    '11999999996', '12345678906', 'STUDENT', 'active');

insert into public.plans (id, name, external_id, credits_included, price, interval, interval_count)
values
  ('29000000-0000-0000-0000-000000000001', 'Grant paid plan', 'plan_manual_grant',
    4, 3990, 'month', 1),
  ('29000000-0000-0000-0000-000000000002', 'Grant mentorship plan',
    'internal_mentoria_free', 0, 0, 'month', 3);

insert into public.subscriptions (
  id, user_id, plan_id, status, current_period_start, current_period_end, external_id
)
values
  ('39000000-0000-0000-0000-000000000001', '19000000-0000-0000-0000-000000000002',
    '29000000-0000-0000-0000-000000000001', 'active', now() - interval '1 day',
    now() + interval '10 days', 'sub_manual_grant'),
  ('39000000-0000-0000-0000-000000000002', '19000000-0000-0000-0000-000000000003',
    '29000000-0000-0000-0000-000000000002', 'active', now() - interval '1 day',
    now() + interval '30 days', 'sub_manual_mentorship');

insert into public.hotmart_mentorship_accesses (
  id, webhook_event_id, transaction_id, product_ucode, buyer_email,
  purchase_status, claimed_user_id
)
values (
  '59000000-0000-0000-0000-000000000001',
  '79000000-0000-0000-0000-000000000001',
  'HP-MANUAL-GRANT-TEST',
  'mentorship-manual-grant-test',
  'grant-mentorship@example.com',
  'APPROVED',
  '19000000-0000-0000-0000-000000000003'
);

insert into public.mentorship_credit_allocations (
  id, mentorship_access_id, subscription_id, user_id, cycle_number, amount,
  remaining_amount, available_at, expires_at, released_at, status
)
values
  (
    '49000000-0000-0000-0000-000000000001',
    '59000000-0000-0000-0000-000000000001',
    '39000000-0000-0000-0000-000000000002',
    '19000000-0000-0000-0000-000000000003',
    1, 2, 0, now() - interval '1 day', now() + interval '10 days', now() - interval '1 day',
    'consumed'
  ),
  (
    '49000000-0000-0000-0000-000000000002',
    '59000000-0000-0000-0000-000000000001',
    '39000000-0000-0000-0000-000000000002',
    '19000000-0000-0000-0000-000000000003',
    2, 2, 0, now() + interval '10 days', now() + interval '20 days', null,
    'scheduled'
  );

set local session_replication_role = origin;
set local role authenticated;
set local "request.jwt.claims" =
  '{"role":"authenticated","sub":"19000000-0000-0000-0000-000000000001"}';

-- Successful grants and their persistence rules.
do $test$
declare v_result jsonb;
begin
  begin
    select public.grant_manual_credits(
      '69000000-0000-4000-8000-000000000001',
      '19000000-0000-0000-0000-000000000004',
      'extra', 3, 'courtesy', null
    ) into v_result;

    if v_result ->> 'replayed' <> 'false'
      or not coalesce((select extra_credits = 3 and plan_credits = 0 and free_credits = 0
        from public.student_credits
        where user_id = '19000000-0000-0000-0000-000000000004'), false)
      or not coalesce((select expires_at is null and subscription_id is null
          and mentorship_allocation_id is null
        from public.manual_credit_grants
        where id = '69000000-0000-4000-8000-000000000001'), false)
    then
      raise exception 'saldo, replay ou validade do crédito extra incorretos';
    end if;

    perform pg_temp.record_credit_grant_test('Extra: saldo separado e sem vencimento', true);
  exception when others then
    perform pg_temp.record_credit_grant_test(
      'Extra: saldo separado e sem vencimento', false, sqlstate || ': ' || sqlerrm
    );
  end;
end;
$test$;

do $test$
declare v_result jsonb;
begin
  begin
    select public.grant_manual_credits(
      '69000000-0000-4000-8000-000000000001',
      '19000000-0000-0000-0000-000000000004',
      'extra', 3, 'courtesy', null
    ) into v_result;

    if v_result ->> 'replayed' <> 'true'
      or (select count(*) from public.manual_credit_grants
        where id = '69000000-0000-4000-8000-000000000001') <> 1
      or not coalesce((select extra_credits = 3 from public.student_credits
        where user_id = '19000000-0000-0000-0000-000000000004'), false)
    then
      raise exception 'a repetição alterou o saldo ou duplicou o histórico';
    end if;

    perform pg_temp.record_credit_grant_test('Idempotência: repetição idêntica não duplica', true);
  exception when others then
    perform pg_temp.record_credit_grant_test(
      'Idempotência: repetição idêntica não duplica', false, sqlstate || ': ' || sqlerrm
    );
  end;
end;
$test$;

do $test$
declare v_message text;
begin
  begin
    perform public.grant_manual_credits(
      '69000000-0000-4000-8000-000000000001',
      '19000000-0000-0000-0000-000000000004',
      'extra', 4, 'courtesy', null
    );
    perform pg_temp.record_credit_grant_test(
      'Idempotência: mesma operação com dados diferentes é rejeitada', false,
      'a operação conflitante foi aceita'
    );
  exception when others then
    v_message := sqlerrm;
    perform pg_temp.record_credit_grant_test(
      'Idempotência: mesma operação com dados diferentes é rejeitada',
      position('dados diferentes' in v_message) > 0,
      case when position('dados diferentes' in v_message) = 0 then sqlstate || ': ' || v_message end
    );
  end;
end;
$test$;

do $test$
declare
  v_result jsonb;
  v_expected_expiration timestamptz;
begin
  begin
    select public.subscription_access_end(current_period_end)
    into v_expected_expiration
    from public.subscriptions
    where id = '39000000-0000-0000-0000-000000000001';

    select public.grant_manual_credits(
      '69000000-0000-4000-8000-000000000002',
      '19000000-0000-0000-0000-000000000002',
      'plan', 2, 'technical_issue_compensation', null
    ) into v_result;

    if (v_result ->> 'expires_at')::timestamptz is distinct from v_expected_expiration
      or not coalesce((select plan_credits = 2 and extra_credits = 0 and free_credits = 0
        from public.student_credits
        where user_id = '19000000-0000-0000-0000-000000000002'), false)
      or not coalesce((select subscription_id = '39000000-0000-0000-0000-000000000001'
          and expires_at = v_expected_expiration
        from public.manual_credit_grants
        where id = '69000000-0000-4000-8000-000000000002'), false)
    then
      raise exception 'saldo, vínculo ou validade do crédito de plano incorretos';
    end if;

    perform pg_temp.record_credit_grant_test('Plano: usa exclusivamente o vencimento do ciclo vigente', true);
  exception when others then
    perform pg_temp.record_credit_grant_test(
      'Plano: usa exclusivamente o vencimento do ciclo vigente', false, sqlstate || ': ' || sqlerrm
    );
  end;
end;
$test$;

do $test$
declare v_result jsonb;
begin
  begin
    update public.subscriptions
    set cancel_at_period_end = true
    where id = '39000000-0000-0000-0000-000000000001';

    select public.grant_manual_credits(
      '69000000-0000-4000-8000-000000000003',
      '19000000-0000-0000-0000-000000000002',
      'plan', 1, 'credit_replacement', null
    ) into v_result;

    if v_result ->> 'replayed' <> 'false'
      or not coalesce((select plan_credits = 3 from public.student_credits
        where user_id = '19000000-0000-0000-0000-000000000002'), false)
    then
      raise exception 'o plano com cancelamento agendado não recebeu o crédito corretamente';
    end if;

    perform pg_temp.record_credit_grant_test('Plano: cancelamento ao fim do ciclo mantém elegibilidade', true);
  exception when others then
    perform pg_temp.record_credit_grant_test(
      'Plano: cancelamento ao fim do ciclo mantém elegibilidade', false, sqlstate || ': ' || sqlerrm
    );
  end;
end;
$test$;

do $test$
declare
  v_result jsonb;
  v_current_expiration timestamptz;
begin
  begin
    select expires_at into v_current_expiration
    from public.mentorship_credit_allocations
    where id = '49000000-0000-0000-0000-000000000001';

    select public.grant_manual_credits(
      '69000000-0000-4000-8000-000000000004',
      '19000000-0000-0000-0000-000000000003',
      'mentorship', 4, 'mentorship_bonus', 'Teste isolado de mentoria'
    ) into v_result;

    if (v_result ->> 'expires_at')::timestamptz is distinct from v_current_expiration
      or not coalesce((select remaining_amount = 4 and administrative_grants = 4
          and status = 'active'
        from public.mentorship_credit_allocations
        where id = '49000000-0000-0000-0000-000000000001'), false)
      or not coalesce((select remaining_amount = 0 and administrative_grants = 0
          and status = 'scheduled'
        from public.mentorship_credit_allocations
        where id = '49000000-0000-0000-0000-000000000002'), false)
      or not coalesce((select plan_credits = 0 from public.student_credits
        where user_id = '19000000-0000-0000-0000-000000000003'), false)
    then
      raise exception 'alocação atual, alocação futura ou saldo agregado incorretos';
    end if;

    perform pg_temp.record_credit_grant_test(
      'Mentoria: reativa o ciclo atual sem alterar ciclos futuros ou saldo do plano', true
    );
  exception when others then
    perform pg_temp.record_credit_grant_test(
      'Mentoria: reativa o ciclo atual sem alterar ciclos futuros ou saldo do plano',
      false, sqlstate || ': ' || sqlerrm
    );
  end;
end;
$test$;

do $test$
begin
  begin
    perform public.grant_manual_credits(
      '69000000-0000-4000-8000-000000000005',
      '19000000-0000-0000-0000-000000000004',
      'extra', 2, 'administrative_adjustment', 'Correção administrativa isolada'
    );

    if not coalesce((select internal_note = 'Correção administrativa isolada'
        and administrator_id = '19000000-0000-0000-0000-000000000001'
      from public.manual_credit_grants
      where id = '69000000-0000-4000-8000-000000000005'), false)
    then
      raise exception 'a auditoria privada não armazenou administrador e observação';
    end if;

    perform pg_temp.record_credit_grant_test('Auditoria: administrador e observação interna são registrados', true);
  exception when others then
    perform pg_temp.record_credit_grant_test(
      'Auditoria: administrador e observação interna são registrados', false,
      sqlstate || ': ' || sqlerrm
    );
  end;
end;
$test$;

do $test$
begin
  begin
    if not coalesce((select
        metadata ->> 'source' = 'manual_credit_grant'
        and metadata ->> 'grant_category' = 'extra'
        and metadata ->> 'reason' = 'courtesy'
        and not (metadata ? 'internal_note')
        and not (metadata ? 'administrator_id')
      from public.credit_transactions
      where id = (
        select credit_transaction_id
        from public.manual_credit_grants
        where id = '69000000-0000-4000-8000-000000000001'
      )), false)
    then
      raise exception 'metadados públicos ausentes ou contendo dados privados';
    end if;

    perform pg_temp.record_credit_grant_test('Histórico do aluno: completo e sem dados privados', true);
  exception when others then
    perform pg_temp.record_credit_grant_test(
      'Histórico do aluno: completo e sem dados privados', false, sqlstate || ': ' || sqlerrm
    );
  end;
end;
$test$;

-- Expected rejections. Each block is a subtransaction so one failure never
-- prevents the remaining scenarios from running.
do $test$
declare v_message text;
begin
  begin
    perform public.grant_manual_credits(
      '69000000-0000-4000-8000-000000000006',
      '19000000-0000-0000-0000-000000000005',
      'extra', 1, 'courtesy', null
    );
    perform pg_temp.record_credit_grant_test('Bloqueio: aluno bloqueado não recebe créditos', false, 'operação aceita');
  exception when others then
    v_message := sqlerrm;
    if position('conta bloqueada' in v_message) > 0
      and not exists (select 1 from public.manual_credit_grants
        where id = '69000000-0000-4000-8000-000000000006')
      and not exists (select 1 from public.student_credits
        where user_id = '19000000-0000-0000-0000-000000000005')
    then
      perform pg_temp.record_credit_grant_test('Bloqueio: aluno bloqueado não recebe créditos', true);
    else
      perform pg_temp.record_credit_grant_test(
        'Bloqueio: aluno bloqueado não recebe créditos', false, sqlstate || ': ' || v_message
      );
    end if;
  end;
end;
$test$;

do $test$
declare v_message text;
begin
  begin
    perform public.grant_manual_credits(
      '69000000-0000-4000-8000-000000000007',
      '19000000-0000-0000-0000-000000000004',
      'extra', 1, 'administrative_adjustment', null
    );
    perform pg_temp.record_credit_grant_test('Validação: observação obrigatória é exigida', false, 'operação aceita');
  exception when others then
    v_message := sqlerrm;
    perform pg_temp.record_credit_grant_test(
      'Validação: observação obrigatória é exigida',
      position('observação interna' in v_message) > 0,
      case when position('observação interna' in v_message) = 0 then sqlstate || ': ' || v_message end
    );
  end;
end;
$test$;

do $test$
declare v_message text;
begin
  begin
    perform public.grant_manual_credits(
      '69000000-0000-4000-8000-000000000008',
      '19000000-0000-0000-0000-000000000004',
      'extra', 0, 'courtesy', null
    );
    perform pg_temp.record_credit_grant_test('Validação: quantidade zero é rejeitada', false, 'operação aceita');
  exception when others then
    v_message := sqlerrm;
    perform pg_temp.record_credit_grant_test(
      'Validação: quantidade zero é rejeitada',
      position('entre 1 e 100' in v_message) > 0,
      case when position('entre 1 e 100' in v_message) = 0 then sqlstate || ': ' || v_message end
    );
  end;
end;
$test$;

do $test$
declare v_message text;
begin
  begin
    perform public.grant_manual_credits(
      '69000000-0000-4000-8000-000000000009',
      '19000000-0000-0000-0000-000000000004',
      'extra', 101, 'courtesy', null
    );
    perform pg_temp.record_credit_grant_test('Validação: quantidade acima de 100 é rejeitada', false, 'operação aceita');
  exception when others then
    v_message := sqlerrm;
    perform pg_temp.record_credit_grant_test(
      'Validação: quantidade acima de 100 é rejeitada',
      position('entre 1 e 100' in v_message) > 0,
      case when position('entre 1 e 100' in v_message) = 0 then sqlstate || ': ' || v_message end
    );
  end;
end;
$test$;

do $test$
declare v_message text;
begin
  begin
    perform public.grant_manual_credits(
      '69000000-0000-4000-8000-000000000010',
      '19000000-0000-0000-0000-000000000004',
      'extra', 1, 'mentorship_bonus', null
    );
    perform pg_temp.record_credit_grant_test('Validação: bônus da mentoria exige crédito de mentoria', false, 'operação aceita');
  exception when others then
    v_message := sqlerrm;
    perform pg_temp.record_credit_grant_test(
      'Validação: bônus da mentoria exige crédito de mentoria',
      position('só pode ser usado' in v_message) > 0,
      case when position('só pode ser usado' in v_message) = 0 then sqlstate || ': ' || v_message end
    );
  end;
end;
$test$;

do $test$
declare v_message text;
begin
  begin
    perform public.grant_manual_credits(
      '69000000-0000-4000-8000-000000000011',
      '19000000-0000-0000-0000-000000000006',
      'plan', 1, 'courtesy', null
    );
    perform pg_temp.record_credit_grant_test('Elegibilidade: plano sem ciclo pago vigente é rejeitado', false, 'operação aceita');
  exception when others then
    v_message := sqlerrm;
    perform pg_temp.record_credit_grant_test(
      'Elegibilidade: plano sem ciclo pago vigente é rejeitado',
      position('ciclo vigente de plano pago' in v_message) > 0,
      case when position('ciclo vigente de plano pago' in v_message) = 0 then sqlstate || ': ' || v_message end
    );
  end;
end;
$test$;

do $test$
declare v_message text;
begin
  begin
    perform public.grant_manual_credits(
      '69000000-0000-4000-8000-000000000012',
      '19000000-0000-0000-0000-000000000006',
      'mentorship', 1, 'mentorship_bonus', null
    );
    perform pg_temp.record_credit_grant_test('Elegibilidade: mentoria sem ciclo vigente é rejeitada', false, 'operação aceita');
  exception when others then
    v_message := sqlerrm;
    perform pg_temp.record_credit_grant_test(
      'Elegibilidade: mentoria sem ciclo vigente é rejeitada',
      position('ciclo vigente de mentoria' in v_message) > 0,
      case when position('ciclo vigente de mentoria' in v_message) = 0 then sqlstate || ': ' || v_message end
    );
  end;
end;
$test$;

-- Build this state as the database owner. An authenticated administrator can
-- invoke the RPC, but direct subscription updates remain protected by RLS.
reset role;
update public.subscriptions
set withdrawal_status = 'under_review'
where id = '39000000-0000-0000-0000-000000000001';
set local role authenticated;

do $test$
declare v_message text;
begin
  begin
    perform public.grant_manual_credits(
      '69000000-0000-4000-8000-000000000013',
      '19000000-0000-0000-0000-000000000002',
      'plan', 1, 'courtesy', null
    );
    perform pg_temp.record_credit_grant_test('Elegibilidade: atendimento do plano em andamento bloqueia adição', false, 'operação aceita');
  exception when others then
    v_message := sqlerrm;
    perform pg_temp.record_credit_grant_test(
      'Elegibilidade: atendimento do plano em andamento bloqueia adição',
      position('atendimento em andamento' in v_message) > 0,
      case when position('atendimento em andamento' in v_message) = 0 then sqlstate || ': ' || v_message end
    );
  end;
end;
$test$;

-- RLS and RPC authorization as the student who received extra credits.
set local "request.jwt.claims" =
  '{"role":"authenticated","sub":"19000000-0000-0000-0000-000000000004"}';

do $test$
begin
  begin
    if (select count(*) from public.manual_credit_grants) <> 0 then
      raise exception 'o aluno conseguiu ler a auditoria administrativa';
    end if;

    if (select count(*) from public.credit_transactions
      where user_id = '19000000-0000-0000-0000-000000000004'
        and metadata ->> 'source' = 'manual_credit_grant') <> 2
    then
      raise exception 'o histórico público do próprio aluno não ficou disponível';
    end if;

    perform pg_temp.record_credit_grant_test('Privacidade: aluno vê seu histórico, mas não a auditoria interna', true);
  exception when others then
    perform pg_temp.record_credit_grant_test(
      'Privacidade: aluno vê seu histórico, mas não a auditoria interna', false,
      sqlstate || ': ' || sqlerrm
    );
  end;
end;
$test$;

do $test$
declare v_message text;
begin
  begin
    perform public.grant_manual_credits(
      '69000000-0000-4000-8000-000000000014',
      '19000000-0000-0000-0000-000000000004',
      'extra', 1, 'courtesy', null
    );
    perform pg_temp.record_credit_grant_test('Autorização: aluno não pode adicionar créditos', false, 'operação aceita');
  exception when others then
    v_message := sqlerrm;
    perform pg_temp.record_credit_grant_test(
      'Autorização: aluno não pode adicionar créditos',
      position('Acesso não autorizado' in v_message) > 0,
      case when position('Acesso não autorizado' in v_message) = 0 then sqlstate || ': ' || v_message end
    );
  end;
end;
$test$;

reset role;

\echo ''
\echo 'Admin credit grants - complete isolated test report'
select
  case when passed then 'PASS' else 'FAIL' end as result,
  scenario,
  coalesce(details, '') as details
from credit_grant_test_results
order by sequence;

select
  count(*) filter (where passed) as passed,
  count(*) filter (where not passed) as failed,
  count(*) as total
from credit_grant_test_results;

rollback;
\echo 'Isolated credit grant scenarios finished; the workflow validates the report.'
