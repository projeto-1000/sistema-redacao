-- Security baseline for the isolated production project.
-- Application data is intentionally not included.

-- Every application table uses RLS. Tables without a policy are service-role only.
alter table public.correction_drafts enable row level security;
alter table public.credit_transactions enable row level security;
alter table public.essay_backups enable row level security;
alter table public.essay_topics enable row level security;
alter table public.essays enable row level security;
alter table public.free_credit_allocations enable row level security;
alter table public.holidays enable row level security;
alter table public.hotmart_invites enable row level security;
alter table public.hotmart_mentorship_accesses enable row level security;
alter table public.hotmart_webhook_events enable row level security;
alter table public.invoices enable row level security;
alter table public.mentorship_credit_allocations enable row level security;
alter table public.motivational_texts enable row level security;
alter table public.pagarme_webhook_events enable row level security;
alter table public.plans enable row level security;
alter table public.profiles enable row level security;
alter table public.student_credits enable row level security;
alter table public.student_details enable row level security;
alter table public.student_payment_cards enable row level security;
alter table public.student_payments enable row level security;
alter table public.subscription_history enable row level security;
alter table public.subscriptions enable row level security;
alter table public.teacher_payment_accounts enable row level security;
alter table public.teacher_payments enable row level security;

grant usage on schema public to anon, authenticated, service_role;
grant select on public.plans, public.essay_topics, public.motivational_texts to anon;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;
grant all privileges on all tables in schema public to service_role;
grant all privileges on all sequences in schema public to service_role;

create policy "Public can read plans"
on public.plans for select
to anon, authenticated
using (true);

create policy "Admins manage plans"
on public.plans
to authenticated
using (public.get_my_role() = 'ADMIN')
with check (public.get_my_role() = 'ADMIN');

create policy "Public can read essay topics"
on public.essay_topics for select
to anon, authenticated
using (true);

create policy "Admins insert essay topics"
on public.essay_topics for insert
to authenticated
with check (public.get_my_role() = 'ADMIN');

create policy "Admins update essay topics"
on public.essay_topics for update
to authenticated
using (public.get_my_role() = 'ADMIN')
with check (public.get_my_role() = 'ADMIN');

create policy "Admins delete essay topics"
on public.essay_topics for delete
to authenticated
using (public.get_my_role() = 'ADMIN');

create policy "Public can read motivational texts"
on public.motivational_texts for select
to anon, authenticated
using (true);

create policy "Admins insert motivational texts"
on public.motivational_texts for insert
to authenticated
with check (public.get_my_role() = 'ADMIN');

create policy "Admins update motivational texts"
on public.motivational_texts for update
to authenticated
using (public.get_my_role() = 'ADMIN')
with check (public.get_my_role() = 'ADMIN');

create policy "Admins delete motivational texts"
on public.motivational_texts for delete
to authenticated
using (public.get_my_role() = 'ADMIN');

create policy "Users can read their own profile"
on public.profiles for select
to authenticated
using (id = auth.uid());

create policy "Admins can read every profile"
on public.profiles for select
to authenticated
using (public.get_my_role() = 'ADMIN');

create policy "Teachers can read student profiles"
on public.profiles for select
to authenticated
using (public.get_my_role() = 'TEACHER' and role = 'STUDENT');

create policy "Users can update their own profile"
on public.profiles for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create policy "Admins can update every profile"
on public.profiles for update
to authenticated
using (public.get_my_role() = 'ADMIN')
with check (public.get_my_role() = 'ADMIN');

create policy "Students can read their own details"
on public.student_details for select
to authenticated
using (id = auth.uid() or public.get_my_role() = 'ADMIN');

create policy "Students can insert their own details"
on public.student_details for insert
to authenticated
with check (id = auth.uid());

create policy "Students can update their own details"
on public.student_details for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create policy "Students can delete their own details"
on public.student_details for delete
to authenticated
using (id = auth.uid());

create policy "Students can read their own essays"
on public.essays for select
to authenticated
using (student_id = auth.uid());

create policy "Admins can read every essay"
on public.essays for select
to authenticated
using (public.get_my_role() = 'ADMIN');

create policy "Teachers can read available or assigned essays"
on public.essays for select
to authenticated
using (
  public.get_my_role() = 'TEACHER'
  and (teacher_id is null or teacher_id = auth.uid())
);

create policy "Students can insert their own essays"
on public.essays for insert
to authenticated
with check (student_id = auth.uid() and public.get_my_role() = 'STUDENT');

create policy "Students can delete their own draft essays"
on public.essays for delete
to authenticated
using (student_id = auth.uid() and status = 'draft');

create policy "Admins can update every essay"
on public.essays for update
to authenticated
using (public.get_my_role() = 'ADMIN')
with check (public.get_my_role() = 'ADMIN');

create policy "Teachers can claim or update assigned essays"
on public.essays for update
to authenticated
using (
  public.get_my_role() = 'TEACHER'
  and (teacher_id is null or teacher_id = auth.uid())
  and status in ('pending', 'correcting')
)
with check (teacher_id = auth.uid());

create policy "Users manage their own essay backups"
on public.essay_backups
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "Teachers manage their own correction drafts"
on public.correction_drafts
to authenticated
using (teacher_id = auth.uid() and public.get_my_role() = 'TEACHER')
with check (teacher_id = auth.uid() and public.get_my_role() = 'TEACHER');

create policy "Students read their own credits"
on public.student_credits for select
to authenticated
using (user_id = auth.uid() or public.get_my_role() = 'ADMIN');

create policy "Students read their own credit transactions"
on public.credit_transactions for select
to authenticated
using (user_id = auth.uid() or public.get_my_role() = 'ADMIN');

create policy "Admins manage credit transactions"
on public.credit_transactions
to authenticated
using (public.get_my_role() = 'ADMIN')
with check (public.get_my_role() = 'ADMIN');

create policy "Students read their own free credit allocations"
on public.free_credit_allocations for select
to authenticated
using (user_id = auth.uid() or public.get_my_role() = 'ADMIN');

create policy "Students read their own mentorship allocations"
on public.mentorship_credit_allocations for select
to authenticated
using (user_id = auth.uid() or public.get_my_role() = 'ADMIN');

create policy "Students read their own subscription"
on public.subscriptions for select
to authenticated
using (user_id = auth.uid() or public.get_my_role() = 'ADMIN');

create policy "Students read their own payment cards"
on public.student_payment_cards for select
to authenticated
using (user_id = auth.uid() or public.get_my_role() = 'ADMIN');

create policy "Students read their own payments"
on public.student_payments for select
to authenticated
using (user_id = auth.uid() or public.get_my_role() = 'ADMIN');

create policy "Admins read subscription history"
on public.subscription_history for select
to authenticated
using (public.get_my_role() = 'ADMIN');

create policy "Admins manage teacher payment accounts"
on public.teacher_payment_accounts
to authenticated
using (public.get_my_role() = 'ADMIN')
with check (public.get_my_role() = 'ADMIN');

create policy "Teachers read their own payment accounts"
on public.teacher_payment_accounts for select
to authenticated
using (teacher_id = auth.uid() and public.get_my_role() = 'TEACHER');

create policy "Teachers insert their own payment accounts"
on public.teacher_payment_accounts for insert
to authenticated
with check (teacher_id = auth.uid() and public.get_my_role() = 'TEACHER');

create policy "Teachers update their own payment accounts"
on public.teacher_payment_accounts for update
to authenticated
using (teacher_id = auth.uid() and public.get_my_role() = 'TEACHER')
with check (teacher_id = auth.uid() and public.get_my_role() = 'TEACHER');

create policy "Teachers delete their own payment accounts"
on public.teacher_payment_accounts for delete
to authenticated
using (teacher_id = auth.uid() and public.get_my_role() = 'TEACHER');

create policy "Admins manage teacher payments"
on public.teacher_payments
to authenticated
using (public.get_my_role() = 'ADMIN')
with check (public.get_my_role() = 'ADMIN');

-- Prevent authenticated users from changing their own authorization or billing identity.
create function public.protect_profile_privileged_fields()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.role() = 'authenticated' and not public.is_admin() then
    if new.id is distinct from old.id
      or new.email is distinct from old.email
      or new.role is distinct from old.role
      or new.status is distinct from old.status
      or new.document is distinct from old.document
      or new.pagarme_customer_id is distinct from old.pagarme_customer_id
      or new.acquisition_channel is distinct from old.acquisition_channel
    then
      raise exception 'Protected profile fields cannot be changed by this user.';
    end if;
  end if;

  return new;
end;
$$;

create trigger protect_profile_privileged_fields
before update on public.profiles
for each row execute function public.protect_profile_privileged_fields();

-- Add the application profile after a Supabase Auth user is created.
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Wrap privileged RPCs with explicit authorization checks.
alter function public.get_dashboard_metrics() rename to get_dashboard_metrics_internal;

create function public.get_dashboard_metrics()
returns json
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Access denied.';
  end if;

  return public.get_dashboard_metrics_internal();
end;
$$;

alter function public.return_essay_to_student(uuid, text, text)
rename to return_essay_to_student_internal;

create function public.return_essay_to_student(
  p_essay_id uuid,
  p_reason text,
  p_description text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  requester_role public.app_role;
begin
  select profile.role
  into requester_role
  from public.profiles as profile
  where profile.id = auth.uid();

  if requester_role = 'ADMIN' then
    perform public.return_essay_to_student_internal(p_essay_id, p_reason, p_description);
    return;
  end if;

  if requester_role = 'TEACHER' and exists (
    select 1
    from public.essays as essay
    where essay.id = p_essay_id
      and essay.teacher_id = auth.uid()
  ) then
    perform public.return_essay_to_student_internal(p_essay_id, p_reason, p_description);
    return;
  end if;

  raise exception 'Access denied.';
end;
$$;

-- Functions are private by default; only application entry points are exposed.
do $$
declare
  function_name regprocedure;
begin
  for function_name in
    select function_oid::regprocedure
    from (
      select routine.oid as function_oid
      from pg_proc as routine
      join pg_namespace as namespace on namespace.oid = routine.pronamespace
      where namespace.nspname = 'public'
    ) as public_functions
  loop
    execute format(
      'revoke all privileges on function %s from public, anon, authenticated',
      function_name
    );
  end loop;
end;
$$;

grant execute on all functions in schema public to service_role;
grant execute on function public.axis_text(public.essay_topics) to anon, authenticated;
grant execute on function public.check_document_exists(text) to anon, authenticated;
grant execute on function public.complete_student_onboarding(text, text, text, text, text) to authenticated;
grant execute on function public.get_current_student_credit_summary() to authenticated;
grant execute on function public.get_dashboard_metrics() to authenticated;
grant execute on function public.get_my_role() to authenticated;
grant execute on function public.get_student_evolution(uuid, integer) to authenticated;
grant execute on function public.get_subscription_history_events(uuid, integer, integer, text, timestamptz, timestamptz) to authenticated;
grant execute on function public.get_teacher_average_time(uuid, text) to authenticated;
grant execute on function public.get_teacher_correction_heatmap(uuid) to authenticated;
grant execute on function public.get_teacher_daily_averages(uuid) to authenticated;
grant execute on function public.get_teacher_performance_stats(uuid) to authenticated;
grant execute on function public.get_teacher_score_distribution(uuid) to authenticated;
grant execute on function public.get_weekly_essay_volume() to authenticated;
grant execute on function public.get_weekly_essay_volume(integer) to authenticated;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.return_essay_to_student(uuid, text, text) to authenticated;
grant execute on function public.submit_essay(uuid, uuid, text, text, text) to authenticated;

-- Storage buckets: public presentation assets, private financial receipts.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars', 'avatars', true, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('themes', 'themes', true, 10485760, array['image/jpeg', 'image/png', 'image/webp']),
  ('receipts', 'receipts', false, 10485760, array['application/pdf'])
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Users upload their own avatars"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users update their own avatars"
on storage.objects for update
to authenticated
using (
  bucket_id = 'avatars'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or name like auth.uid()::text || '-%'
  )
)
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users delete their own avatars"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'avatars'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or name like auth.uid()::text || '-%'
  )
);

create policy "Admins upload theme assets"
on storage.objects for insert
to authenticated
with check (bucket_id = 'themes' and public.get_my_role() = 'ADMIN');

create policy "Admins update theme assets"
on storage.objects for update
to authenticated
using (bucket_id = 'themes' and public.get_my_role() = 'ADMIN')
with check (bucket_id = 'themes' and public.get_my_role() = 'ADMIN');

create policy "Admins delete theme assets"
on storage.objects for delete
to authenticated
using (bucket_id = 'themes' and public.get_my_role() = 'ADMIN');

create policy "Admins manage private receipts"
on storage.objects
to authenticated
using (bucket_id = 'receipts' and public.get_my_role() = 'ADMIN')
with check (bucket_id = 'receipts' and public.get_my_role() = 'ADMIN');
