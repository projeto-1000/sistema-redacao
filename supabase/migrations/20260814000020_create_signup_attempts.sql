begin;

create table public.signup_attempts (
    id uuid primary key default gen_random_uuid(),
    token_hash text unique not null,
    name text not null,
    email text not null,
    document varchar(11) not null,
    phone_country_code varchar(4) not null,
    phone varchar(20) not null,
    terms_accepted_at timestamptz not null,
    acquisition_channel text not null default 'ORGANIC',
    expires_at timestamptz not null,
    processing_at timestamptz,
    completed_at timestamptz,
    last_error_code text null,
    last_error_at timestamptz null,
    created_at timestamptz not null default now(),
    constraint signup_attempts_token_hash_valid
        check (token_hash ~ '^[0-9a-f]{64}$'),
    constraint signup_attempts_name_not_blank
        check (length(btrim(name)) > 0),
    constraint signup_attempts_email_not_blank
        check (length(btrim(email)) > 0),
    constraint signup_attempts_document_valid
        check (document ~ '^[0-9]{11}$'),
    constraint signup_attempts_phone_country_code_valid
        check (phone_country_code ~ '^[0-9]{1,4}$'),
    constraint signup_attempts_phone_valid
        check (phone ~ '^[0-9]{10,20}$'),
    constraint signup_attempts_acquisition_channel_valid
        check (acquisition_channel in ('ORGANIC', 'HOTMART_MENTORIA')),
    constraint signup_attempts_expiration_valid
        check (expires_at > created_at),
    constraint signup_attempts_processing_valid
        check (processing_at is null or processing_at >= created_at),
    constraint signup_attempts_completion_valid
        check (completed_at is null or completed_at >= created_at),
    constraint signup_attempts_last_error_code_valid
        check (
            last_error_code is null
            or last_error_code in (
                'DOCUMENT_CHECK_FAILED',
                'EMAIL_CHECK_FAILED',
                'AUTH_SIGNUP_FAILED',
                'PAGARME_CUSTOMER_FAILED',
                'COMPLETION_FAILED'
            )
        ),
    constraint signup_attempts_last_error_consistent
        check ((last_error_code is null) = (last_error_at is null))
);

create index signup_attempts_expires_at_idx
    on public.signup_attempts (expires_at);

alter table public.signup_attempts enable row level security;

revoke all on table public.signup_attempts from public, anon, authenticated;
grant select, insert, update on table public.signup_attempts to service_role;

commit;
