begin;

create function public.return_supervised_correction_to_teacher(
    p_submission_id uuid,
    p_feedback text
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
    v_essay_teacher_id uuid;
    v_essay_status text;
    v_feedback text := nullif(btrim(p_feedback), '');
begin
    if v_admin_id is null then
        raise exception 'User is not authenticated.';
    end if;

    select profile.role
    into v_admin_role
    from public.profiles as profile
    where profile.id = v_admin_id;

    if not found or v_admin_role is distinct from 'ADMIN'::public.app_role then
        raise exception 'Only admins can return supervised corrections.';
    end if;

    if v_feedback is null then
        raise exception 'Return feedback is required.';
    end if;

    select
        submission.essay_id,
        submission.teacher_id,
        submission.status
    into
        v_essay_id,
        v_submission_teacher_id,
        v_submission_status
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
        raise exception 'Essay must be in correcting status before returning the correction.';
    end if;

    if v_essay_teacher_id is distinct from v_submission_teacher_id then
        raise exception 'Essay is not assigned to the submission teacher.';
    end if;

    update public.correction_review_submissions as submission
    set
        status = 'returned_to_teacher',
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
        'returned_to_teacher',
        '{}'::jsonb,
        v_feedback
    );

    -- The essay remains assigned to the same teacher and stays correcting.
    -- A new immutable submission will be created when the teacher resubmits.
    return query
    select
        v_essay_id,
        p_submission_id,
        'returned_to_teacher'::text;
end;
$$;

comment on function public.return_supervised_correction_to_teacher(uuid, text) is
    'Returns a pending supervised correction to its assigned teacher with mandatory feedback, without publishing it to the student.';

revoke all on function public.return_supervised_correction_to_teacher(uuid, text)
    from public, anon, authenticated;

grant execute on function public.return_supervised_correction_to_teacher(uuid, text)
    to authenticated;

commit;
