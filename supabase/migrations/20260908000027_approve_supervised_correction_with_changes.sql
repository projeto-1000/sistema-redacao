begin;

create function public.approve_supervised_correction_with_changes(
    p_submission_id uuid,
    p_payload jsonb
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
    v_original_payload jsonb;
    v_essay_teacher_id uuid;
    v_essay_status text;
    v_score_c1 integer;
    v_score_c2 integer;
    v_score_c3 integer;
    v_score_c4 integer;
    v_score_c5 integer;
    v_next_essay_priorities text[];
    v_rewrite_tasks text[];
    v_competency text;
    v_scores_diff jsonb := '{}'::jsonb;
    v_comments_diff jsonb := '{}'::jsonb;
    v_fields_diff jsonb := '{}'::jsonb;
    v_changes jsonb;
begin
    if v_admin_id is null then
        raise exception 'User is not authenticated.';
    end if;

    select profile.role
    into v_admin_role
    from public.profiles as profile
    where profile.id = v_admin_id;

    if not found or v_admin_role is distinct from 'ADMIN'::public.app_role then
        raise exception 'Only admins can approve supervised corrections with changes.';
    end if;

    -- Preserve the lock order used by approve_supervised_correction: lock the
    -- submission first, then its essay.
    select
        submission.essay_id,
        submission.teacher_id,
        submission.status,
        submission.payload
    into
        v_essay_id,
        v_submission_teacher_id,
        v_submission_status,
        v_original_payload
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

    -- Validate the final administrative payload independently of TypeScript.
    if jsonb_typeof(p_payload) is distinct from 'object' then
        raise exception 'Correction payload must be a JSON object.';
    end if;

    if jsonb_typeof(p_payload -> 'scores') is distinct from 'object' then
        raise exception 'Correction payload scores must be a JSON object.';
    end if;

    if exists (
        select 1
        from unnest(array['c1', 'c2', 'c3', 'c4', 'c5']) as competency(key)
        where jsonb_typeof(p_payload -> 'scores' -> competency.key) is distinct from 'number'
    ) then
        raise exception 'Correction payload must contain numeric scores c1 through c5.';
    end if;

    if exists (
        select 1
        from unnest(array['c1', 'c2', 'c3', 'c4', 'c5']) as competency(key)
        where (p_payload -> 'scores' ->> competency.key)::numeric
            not in (0, 40, 80, 120, 160, 200)
    ) then
        raise exception 'Correction payload scores must be integers at allowed ENEM score levels.';
    end if;

    if jsonb_typeof(p_payload -> 'comments') is distinct from 'object' then
        raise exception 'Correction payload comments must be a JSON object.';
    end if;

    if exists (
        select 1
        from unnest(array['c1', 'c2', 'c3', 'c4', 'c5']) as competency(key)
        where jsonb_typeof(p_payload -> 'comments' -> competency.key) is distinct from 'string'
    ) then
        raise exception 'Correction payload must contain string comments c1 through c5.';
    end if;

    if exists (
        select 1
        from unnest(array['c1', 'c2', 'c3', 'c4', 'c5']) as competency(key)
        where nullif(
                regexp_replace(
                    p_payload -> 'comments' ->> competency.key,
                    '^[[:space:]]+|[[:space:]]+$',
                    '',
                    'g'
                ),
                ''
            ) is null
           or char_length(p_payload -> 'comments' ->> competency.key) > 1000
    ) then
        raise exception 'Correction payload comments must be non-empty and at most 1,000 characters.';
    end if;

    if jsonb_typeof(p_payload -> 'general_comment') is distinct from 'string'
       or nullif(
            regexp_replace(
                p_payload ->> 'general_comment',
                '^[[:space:]]+|[[:space:]]+$',
                '',
                'g'
            ),
            ''
        ) is null
       or char_length(
            regexp_replace(
                p_payload ->> 'general_comment',
                '^[[:space:]]+|[[:space:]]+$',
                '',
                'g'
            )
        ) > 3000 then
        raise exception 'Correction payload general_comment must be non-empty and at most 3,000 characters.';
    end if;

    if jsonb_typeof(p_payload -> 'main_bottleneck') is distinct from 'string'
       or nullif(
            regexp_replace(
                p_payload ->> 'main_bottleneck',
                '^[[:space:]]+|[[:space:]]+$',
                '',
                'g'
            ),
            ''
        ) is null
       or char_length(
            regexp_replace(
                p_payload ->> 'main_bottleneck',
                '^[[:space:]]+|[[:space:]]+$',
                '',
                'g'
            )
        ) > 500 then
        raise exception 'Correction payload main_bottleneck must be non-empty and at most 500 characters.';
    end if;

    if jsonb_typeof(p_payload -> 'next_essay_priorities') is distinct from 'array' then
        raise exception 'Correction payload next_essay_priorities must be an array.';
    end if;

    if jsonb_array_length(p_payload -> 'next_essay_priorities') not between 1 and 3 then
        raise exception 'Correction payload next_essay_priorities must contain between 1 and 3 items.';
    end if;

    if exists (
        select 1
        from jsonb_array_elements(p_payload -> 'next_essay_priorities') as priority(value)
        where jsonb_typeof(priority.value) is distinct from 'string'
           or nullif(
                regexp_replace(
                    priority.value #>> '{}',
                    '^[[:space:]]+|[[:space:]]+$',
                    '',
                    'g'
                ),
                ''
            ) is null
           or char_length(
                regexp_replace(
                    priority.value #>> '{}',
                    '^[[:space:]]+|[[:space:]]+$',
                    '',
                    'g'
                )
            ) > 250
    ) then
        raise exception 'Correction payload next_essay_priorities items must be non-empty strings of at most 250 characters.';
    end if;

    if jsonb_typeof(p_payload -> 'rewrite_tasks') is distinct from 'array' then
        raise exception 'Correction payload rewrite_tasks must be an array.';
    end if;

    if jsonb_array_length(p_payload -> 'rewrite_tasks') not between 1 and 3 then
        raise exception 'Correction payload rewrite_tasks must contain between 1 and 3 items.';
    end if;

    if exists (
        select 1
        from jsonb_array_elements(p_payload -> 'rewrite_tasks') as task(value)
        where jsonb_typeof(task.value) is distinct from 'string'
           or nullif(
                regexp_replace(
                    task.value #>> '{}',
                    '^[[:space:]]+|[[:space:]]+$',
                    '',
                    'g'
                ),
                ''
            ) is null
           or char_length(
                regexp_replace(
                    task.value #>> '{}',
                    '^[[:space:]]+|[[:space:]]+$',
                    '',
                    'g'
                )
            ) > 250
    ) then
        raise exception 'Correction payload rewrite_tasks items must be non-empty strings of at most 250 characters.';
    end if;

    if jsonb_typeof(p_payload -> 'highlights') is distinct from 'array' then
        raise exception 'Correction payload highlights must be an array.';
    end if;

    if exists (
        select 1
        from jsonb_array_elements(p_payload -> 'highlights') as highlight(value)
        where jsonb_typeof(highlight.value) is distinct from 'object'
    ) then
        raise exception 'Each correction highlight must be a JSON object.';
    end if;

    if exists (
        select 1
        from jsonb_array_elements(p_payload -> 'highlights') as highlight(value)
        where jsonb_typeof(highlight.value -> 'id') is distinct from 'string'
           or char_length(highlight.value ->> 'id') = 0
           or jsonb_typeof(highlight.value -> 'text') is distinct from 'string'
           or char_length(highlight.value ->> 'text') = 0
           or jsonb_typeof(highlight.value -> 'compId') is distinct from 'string'
           or (highlight.value ->> 'compId') not in ('c1', 'c2', 'c3', 'c4', 'c5')
           or jsonb_typeof(highlight.value -> 'comment') is distinct from 'string'
           or nullif(
                regexp_replace(
                    highlight.value ->> 'comment',
                    '^[[:space:]]+|[[:space:]]+$',
                    '',
                    'g'
                ),
                ''
            ) is null
           or char_length(
                regexp_replace(
                    highlight.value ->> 'comment',
                    '^[[:space:]]+|[[:space:]]+$',
                    '',
                    'g'
                )
            ) > 2000
           or jsonb_typeof(highlight.value -> 'startIndex') is distinct from 'number'
           or jsonb_typeof(highlight.value -> 'endIndex') is distinct from 'number'
    ) then
        raise exception 'Correction highlights do not match the required structure.';
    end if;

    if exists (
        select 1
        from jsonb_array_elements(p_payload -> 'highlights') as highlight(value)
        where (highlight.value ->> 'startIndex')::numeric
                <> trunc((highlight.value ->> 'startIndex')::numeric)
           or (highlight.value ->> 'endIndex')::numeric
                <> trunc((highlight.value ->> 'endIndex')::numeric)
           or (highlight.value ->> 'startIndex')::numeric < 0
           or (highlight.value ->> 'endIndex')::numeric < 0
           or (highlight.value ->> 'endIndex')::numeric
                <= (highlight.value ->> 'startIndex')::numeric
    ) then
        raise exception 'Correction highlight indexes must be non-negative integers with endIndex greater than startIndex.';
    end if;

    begin
        v_score_c1 := (p_payload #>> '{scores,c1}')::integer;
        v_score_c2 := (p_payload #>> '{scores,c2}')::integer;
        v_score_c3 := (p_payload #>> '{scores,c3}')::integer;
        v_score_c4 := (p_payload #>> '{scores,c4}')::integer;
        v_score_c5 := (p_payload #>> '{scores,c5}')::integer;
    exception
        when invalid_text_representation or numeric_value_out_of_range then
            raise exception 'Correction payload scores c1 through c5 must be valid integers.';
    end;

    select coalesce(
        array_agg(priority.value order by priority.ordinality),
        array[]::text[]
    )
    into v_next_essay_priorities
    from jsonb_array_elements_text(p_payload -> 'next_essay_priorities')
        with ordinality as priority(value, ordinality);

    select coalesce(
        array_agg(task.value order by task.ordinality),
        array[]::text[]
    )
    into v_rewrite_tasks
    from jsonb_array_elements_text(p_payload -> 'rewrite_tasks')
        with ordinality as task(value, ordinality);

    -- Build the authoritative field-level diff from the immutable teacher
    -- submission and the fully validated final administrative payload.
    foreach v_competency in array array['c1', 'c2', 'c3', 'c4', 'c5']
    loop
        if (v_original_payload -> 'scores' -> v_competency)
            is distinct from (p_payload -> 'scores' -> v_competency) then
            v_scores_diff := v_scores_diff || jsonb_build_object(
                v_competency,
                jsonb_build_object(
                    'before', v_original_payload -> 'scores' -> v_competency,
                    'after', p_payload -> 'scores' -> v_competency
                )
            );
        end if;

        if (v_original_payload -> 'comments' -> v_competency)
            is distinct from (p_payload -> 'comments' -> v_competency) then
            v_comments_diff := v_comments_diff || jsonb_build_object(
                v_competency,
                jsonb_build_object(
                    'before', v_original_payload -> 'comments' -> v_competency,
                    'after', p_payload -> 'comments' -> v_competency
                )
            );
        end if;
    end loop;

    if v_scores_diff <> '{}'::jsonb then
        v_fields_diff := v_fields_diff || jsonb_build_object('scores', v_scores_diff);
    end if;

    if v_comments_diff <> '{}'::jsonb then
        v_fields_diff := v_fields_diff || jsonb_build_object('comments', v_comments_diff);
    end if;

    if (v_original_payload -> 'general_comment')
        is distinct from (p_payload -> 'general_comment') then
        v_fields_diff := v_fields_diff || jsonb_build_object(
            'general_comment',
            jsonb_build_object(
                'before', v_original_payload -> 'general_comment',
                'after', p_payload -> 'general_comment'
            )
        );
    end if;

    if (v_original_payload -> 'main_bottleneck')
        is distinct from (p_payload -> 'main_bottleneck') then
        v_fields_diff := v_fields_diff || jsonb_build_object(
            'main_bottleneck',
            jsonb_build_object(
                'before', v_original_payload -> 'main_bottleneck',
                'after', p_payload -> 'main_bottleneck'
            )
        );
    end if;

    if (v_original_payload -> 'next_essay_priorities')
        is distinct from (p_payload -> 'next_essay_priorities') then
        v_fields_diff := v_fields_diff || jsonb_build_object(
            'next_essay_priorities',
            jsonb_build_object(
                'before', v_original_payload -> 'next_essay_priorities',
                'after', p_payload -> 'next_essay_priorities'
            )
        );
    end if;

    if (v_original_payload -> 'rewrite_tasks')
        is distinct from (p_payload -> 'rewrite_tasks') then
        v_fields_diff := v_fields_diff || jsonb_build_object(
            'rewrite_tasks',
            jsonb_build_object(
                'before', v_original_payload -> 'rewrite_tasks',
                'after', p_payload -> 'rewrite_tasks'
            )
        );
    end if;

    if (v_original_payload -> 'highlights')
        is distinct from (p_payload -> 'highlights') then
        v_fields_diff := v_fields_diff || jsonb_build_object(
            'highlights',
            jsonb_build_object(
                'before', v_original_payload -> 'highlights',
                'after', p_payload -> 'highlights'
            )
        );
    end if;

    if v_fields_diff = '{}'::jsonb then
        raise exception 'The final correction payload does not contain any review changes.';
    end if;

    v_changes := jsonb_build_object(
        'schema_version', 1,
        'fields', v_fields_diff
    );

    update public.essays as essay
    set
        score_c1 = v_score_c1,
        score_c2 = v_score_c2,
        score_c3 = v_score_c3,
        score_c4 = v_score_c4,
        score_c5 = v_score_c5,
        comment_c1 = p_payload #>> '{comments,c1}',
        comment_c2 = p_payload #>> '{comments,c2}',
        comment_c3 = p_payload #>> '{comments,c3}',
        comment_c4 = p_payload #>> '{comments,c4}',
        comment_c5 = p_payload #>> '{comments,c5}',
        general_comment = p_payload ->> 'general_comment',
        main_bottleneck = p_payload ->> 'main_bottleneck',
        next_essay_priorities = v_next_essay_priorities,
        rewrite_tasks = v_rewrite_tasks,
        highlights = p_payload -> 'highlights',
        status = 'corrected',
        correction_date = now(),
        updated_at = now()
    where essay.id = v_essay_id;

    update public.correction_review_submissions as submission
    set
        status = 'approved_with_changes',
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
        'approved_with_changes',
        v_changes,
        null
    );

    return query
    select
        v_essay_id,
        p_submission_id,
        'approved_with_changes'::text;
end;
$$;

comment on function public.approve_supervised_correction_with_changes(uuid, jsonb) is
    'Publishes a fully validated administrative revision while preserving the immutable teacher submission and recording an authoritative field-level diff.';

revoke all on function public.approve_supervised_correction_with_changes(uuid, jsonb)
    from public, anon, authenticated;

grant execute on function public.approve_supervised_correction_with_changes(uuid, jsonb)
    to authenticated;

commit;
