drop policy if exists "Students read active extra credit packages"
  on public.extra_credit_packages;

create policy "Students read active extra credit packages"
  on public.extra_credit_packages
  for select
  to authenticated
  using (is_active);