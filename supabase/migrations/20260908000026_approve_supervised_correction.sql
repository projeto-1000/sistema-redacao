begin;

create function public.approve_supervised_correction(
    p_submission_id uuid
)
returns table (
    essay_id uuid,
    submission_id uuid,
    status text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_admin_id uuid := auth.uid();
    v_admin_role public.app_role;
    v_essay_id uuid;
    v_submission_teacher_id uuid;
    v_submission_status text;
    v_payload jsonb;
    v_essay_teacher_id uuid;
    v_essay_status text;
    v_score_c1 integer;
    v_score_c2 integer;
    v_score_c3 integer;
    v_score_c4 integer;
    v_score_c5 integer;
    v_next_essay_priorities text[];
    v_rewrite_tasks text[];
begin
    if v_admin_id is null then
        raise exception 'User is not authenticated.';
    end if;

    select profile.role
    into v_admin_role
    from public.profiles as profile
    where profile.id = v_admin_id;

    if not found or v_admin_role is distinct from 'ADMIN'::public.app_role then
        raise exception 'Only admins can approve supervised corrections.';
    end if;

    select
        submission.essay_id,
        submission.teacher_id,
        submission.status,
        submission.payload
    into
        v_essay_id,
        v_submission_teacher_id,
        v_submission_status,
        v_payload
    from public.correction_review_submissions as submission
    where submission.id = p_submission_id
    for update;

    if not found then
        raise exception 'Correction review submission not found.';
    end if;

    if v_submission_status is distinct from 'pending_review' then
        raise exception 'Correction review submission is not pending review.';
    end if;

    select
        essay.teacher_id,
        essay.status
    into
        v_essay_teacher_id,
        v_essay_status
    from public.essays as essay
    where essay.id = v_essay_id
    for update;

    if not found then
        raise exception 'Essay not found.';
    end if;

    if v_essay_status is distinct from 'correcting' then
        raise exception 'Essay must be in correcting status before approval.';
    end if;

    if v_essay_teacher_id is distinct from v_submission_teacher_id then
        raise exception 'Essay teacher does not match correction submission teacher.';
    end if;

    if jsonb_typeof(v_payload) is distinct from 'object' then
        raise exception 'Correction payload must be a JSON object.';
    end if;

    if jsonb_typeof(v_payload -> 'scores') is distinct from 'object' then
        raise exception 'Correction payload scores must be a JSON object.';
    end if;

    if jsonb_typeof(v_payload -> 'comments') is distinct from 'object' then
        raise exception 'Correction payload comments must be a JSON object.';
    end if;

    if exists (
        select 1
        from unnest(array['c1', 'c2', 'c3', 'c4', 'c5']) as competency(key)
        where jsonb_typeof(v_payload -> 'scores' -> competency.key) is distinct from 'number'
    ) then
        raise exception 'Correction payload must contain numeric scores c1 through c5.';
    end if;

    if exists (
        select 1
        from unnest(array['c1', 'c2', 'c3', 'c4', 'c5']) as competency(key)
        where (v_payload -> 'scores' ->> competency.key)::numeric
            not in (0, 40, 80, 120, 160, 200)
    ) then
        raise exception 'Correction payload scores must use allowed ENEM score levels.';
    end if;

    if exists (
        select 1
        from unnest(array['c1', 'c2', 'c3', 'c4', 'c5']) as competency(key)
        where jsonb_typeof(v_payload -> 'comments' -> competency.key) is distinct from 'string'
    ) then
        raise exception 'Correction payload must contain string comments c1 through c5.';
    end if;

    if jsonb_typeof(v_payload -> 'general_comment') is distinct from 'string' then
        raise exception 'Correction payload general_comment must be a string.';
    end if;

    if jsonb_typeof(v_payload -> 'main_bottleneck') is distinct from 'string' then
        raise exception 'Correction payload main_bottleneck must be a string.';
    end if;

    if jsonb_typeof(v_payload -> 'next_essay_priorities') is distinct from 'array' then
        raise exception 'Correction payload next_essay_priorities must be an array.';
    end if;

    if jsonb_typeof(v_payload -> 'rewrite_tasks') is distinct from 'array' then
        raise exception 'Correction payload rewrite_tasks must be an array.';
    end if;

    if jsonb_typeof(v_payload -> 'highlights') is distinct from 'array' then
        raise exception 'Correction payload highlights must be an array.';
    end if;

    if exists (
        select 1
        from jsonb_array_elements(v_payload -> 'next_essay_priorities') as priority(value)
        where jsonb_typeof(priority.value) is distinct from 'string'
    ) then
        raise exception 'Correction payload next_essay_priorities must contain only strings.';
    end if;

    if exists (
        select 1
        from jsonb_array_elements(v_payload -> 'rewrite_tasks') as task(value)
        where jsonb_typeof(task.value) is distinct from 'string'
    ) then
        raise exception 'Correction payload rewrite_tasks must contain only strings.';
    end if;

    begin
        v_score_c1 := (v_payload #>> '{scores,c1}')::integer;
        v_score_c2 := (v_payload #>> '{scores,c2}')::integer;
        v_score_c3 := (v_payload #>> '{scores,c3}')::integer;
        v_score_c4 := (v_payload #>> '{scores,c4}')::integer;
        v_score_c5 := (v_payload #>> '{scores,c5}')::integer;
    exception
        when invalid_text_representation or numeric_value_out_of_range then
            raise exception 'Correction payload scores c1 through c5 must be valid integers.';
    end;

    select coalesce(
        array_agg(priority.value order by priority.ordinality),
        array[]::text[]
    )
    into v_next_essay_priorities
    from jsonb_array_elements_text(v_payload -> 'next_essay_priorities')
        with ordinality as priority(value, ordinality);

    select coalesce(
        array_agg(task.value order by task.ordinality),
        array[]::text[]
    )
    into v_rewrite_tasks
    from jsonb_array_elements_text(v_payload -> 'rewrite_tasks')
        with ordinality as task(value, ordinality);

    update public.essays as essay
    set
        score_c1 = v_score_c1,
        score_c2 = v_score_c2,
        score_c3 = v_score_c3,
        score_c4 = v_score_c4,
        score_c5 = v_score_c5,
        comment_c1 = v_payload #>> '{comments,c1}',
        comment_c2 = v_payload #>> '{comments,c2}',
        comment_c3 = v_payload #>> '{comments,c3}',
        comment_c4 = v_payload #>> '{comments,c4}',
        comment_c5 = v_payload #>> '{comments,c5}',
        general_comment = v_payload ->> 'general_comment',
        main_bottleneck = v_payload ->> 'main_bottleneck',
        next_essay_priorities = v_next_essay_priorities,
        rewrite_tasks = v_rewrite_tasks,
        highlights = v_payload -> 'highlights',
        status = 'corrected',
        correction_date = now(),
        updated_at = now()
    where essay.id = v_essay_id;

    update public.correction_review_submissions as submission
    set
        status = 'approved',
        updated_at = now()
    where submission.id = p_submission_id;

    insert into public.correction_review_actions (
        submission_id,
        admin_id,
        action,
        changes,
        feedback
    )
    values (
        p_submission_id,
        v_admin_id,
        'approved',
        '{}'::jsonb,
        null
    );

    return query
    select
        v_essay_id,
        p_submission_id,
        'approved'::text;
end;
$$;

comment on function public.approve_supervised_correction(uuid) is
    'Publishes an immutable supervised correction snapshot after controlled administrative approval.';

revoke all on function public.approve_supervised_correction(uuid)
    from public, anon, authenticated;

grant execute on function public.approve_supervised_correction(uuid)
    to authenticated;

commit;
