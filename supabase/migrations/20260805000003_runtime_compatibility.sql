-- Restore application flows that require authenticated row updates.

drop policy if exists "Students can update their own draft essays" on public.essays;

create policy "Students can update their own draft essays"
on public.essays for update
to authenticated
using (
  student_id = auth.uid()
  and status = 'draft'
  and public.get_my_role() = 'STUDENT'
)
with check (
  student_id = auth.uid()
  and status = 'draft'
  and teacher_id is null
  and public.get_my_role() = 'STUDENT'
);

drop policy if exists "Admins manage correction drafts" on public.correction_drafts;

create policy "Admins manage correction drafts"
on public.correction_drafts
to authenticated
using (public.get_my_role() = 'ADMIN')
with check (public.get_my_role() = 'ADMIN');
