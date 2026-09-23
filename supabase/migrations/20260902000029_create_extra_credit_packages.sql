begin;

create table public.extra_credit_packages (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    description text,
    credits_amount integer not null,
    price_cents integer not null,
    is_active boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint extra_credit_packages_name_not_blank
        check (length(btrim(name)) > 0),
    constraint extra_credit_packages_credits_amount_positive
        check (credits_amount > 0),
    constraint extra_credit_packages_price_cents_positive
        check (price_cents > 0)
);

create index extra_credit_packages_active_catalog_idx
    on public.extra_credit_packages (price_cents, credits_amount, id)
    where is_active;

create function public.set_extra_credit_package_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
    new.updated_at := now();
    return new;
end;
$$;

revoke all on function public.set_extra_credit_package_updated_at()
    from public, anon, authenticated;

create trigger set_extra_credit_package_updated_at
    before update on public.extra_credit_packages
    for each row
    execute function public.set_extra_credit_package_updated_at();

alter table public.extra_credit_packages enable row level security;

revoke all on table public.extra_credit_packages from public, anon, authenticated;
grant select, insert, update on table public.extra_credit_packages to authenticated;
grant select, insert, update on table public.extra_credit_packages to service_role;

create policy "Admins read extra credit packages"
    on public.extra_credit_packages
    for select
    to authenticated
    using (public.get_my_role() = 'ADMIN');

create policy "Admins insert extra credit packages"
    on public.extra_credit_packages
    for insert
    to authenticated
    with check (public.get_my_role() = 'ADMIN');

create policy "Admins update extra credit packages"
    on public.extra_credit_packages
    for update
    to authenticated
    using (public.get_my_role() = 'ADMIN')
    with check (public.get_my_role() = 'ADMIN');

commit;
