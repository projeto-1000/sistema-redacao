begin;

-- Keep the administrative audit focused on the action. The correction payload,
-- field changes and feedback remain available in the correction review history.
create or replace function public.audit_correction_review_action()
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
    new.submission_id::text, 'success', v_summary, '{}'::jsonb,
    jsonb_build_object(
      'essay_id', v_essay_id,
      'student_id', v_student_id
    ),
    new.created_at
  ) on conflict (operation_id) do nothing;

  return new;
end;
$$;

revoke all on function public.audit_correction_review_action()
  from public, anon, authenticated;

commit;
