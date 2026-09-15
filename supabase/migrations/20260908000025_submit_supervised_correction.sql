begin;

-- Review submissions and actions must be mutated only through controlled,
-- transactional SECURITY DEFINER RPCs, never through direct table access.
revoke insert on table public.correction_review_submissions
    from authenticated;

drop policy if exists "Admins create correction review submissions"
    on public.correction_review_submissions;

revoke insert on table public.correction_review_actions
    from authenticated;

drop policy if exists "Admins create correction review actions"
    on public.correction_review_actions;

create function public.submit_supervised_correction(
    p_essay_id uuid,
    p_payload jsonb
)
returns table (
    submission_id uuid,
    round_number integer,
    status text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_teacher_id uuid := auth.uid();
    v_teacher_role public.app_role;
    v_review_required boolean;
    v_assigned_teacher_id uuid;
    v_essay_status text;
    v_previous_submission_status text;
    v_round_number integer;
    v_submission_id uuid;
begin
    if v_teacher_id is null then
        raise exception 'User is not authenticated.';
    end if;

    select
        profile.role,
        profile.correction_review_required
    into
        v_teacher_role,
        v_review_required
    from public.profiles as profile
    where profile.id = v_teacher_id;

    if not found or v_teacher_role is distinct from 'TEACHER'::public.app_role then
        raise exception 'Only teachers can submit supervised corrections.';
    end if;

    if v_review_required is not true then
        raise exception 'Teacher does not require correction review.';
    end if;

    if p_payload is null or jsonb_typeof(p_payload) <> 'object' then
        raise exception 'Correction payload must be a JSON object.';
    end if;

    -- The essay row serializes submissions for the same essay and protects
    -- round_number allocation from concurrent requests.
    select
        essay.teacher_id,
        essay.status
    into
        v_assigned_teacher_id,
        v_essay_status
    from public.essays as essay
    where essay.id = p_essay_id
    for update;

    if not found then
        raise exception 'Essay not found.';
    end if;

    if v_assigned_teacher_id is distinct from v_teacher_id then
        raise exception 'Essay is not assigned to the authenticated teacher.';
    end if;

    -- startEssayCorrection already claims the essay and moves it to correcting.
    -- This RPC deliberately does not claim pending essays through another path.
    if v_essay_status is distinct from 'correcting' then
        raise exception 'Essay must be in correcting status before submission.';
    end if;

    select
        submission.status
    into
        v_previous_submission_status
    from public.correction_review_submissions as submission
    where submission.essay_id = p_essay_id
    order by submission.round_number desc
    limit 1;

    if found and v_previous_submission_status <> 'returned_to_teacher' then
        raise exception 'The latest correction submission is not available for resubmission.';
    end if;

    select
        coalesce(max(submission.round_number), 0) + 1
    into
        v_round_number
    from public.correction_review_submissions as submission
    where submission.essay_id = p_essay_id;

    insert into public.correction_review_submissions (
        essay_id,
        teacher_id,
        round_number,
        payload,
        status
    )
    values (
        p_essay_id,
        v_teacher_id,
        v_round_number,
        p_payload,
        'pending_review'
    )
    returning id into v_submission_id;

    delete from public.correction_drafts as draft
    where draft.essay_id = p_essay_id
      and draft.teacher_id = v_teacher_id;

    -- essays.status remains correcting. Correction data is published to essays
    -- only after a future administrative approval flow.
    return query
    select
        v_submission_id,
        v_round_number,
        'pending_review'::text;
end;
$$;

comment on function public.submit_supervised_correction(uuid, jsonb) is
    'Creates an immutable correction review submission for the authenticated supervised teacher without publishing correction data to the student.';

revoke all on function public.submit_supervised_correction(uuid, jsonb)
    from public, anon, authenticated;

grant execute on function public.submit_supervised_correction(uuid, jsonb)
    to authenticated;

commit;
