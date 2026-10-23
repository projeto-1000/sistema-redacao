begin;

alter table public.essay_source_files
  add column storage_provider text not null default 'supabase';

alter table public.essay_source_files
  add constraint essay_source_files_storage_provider_check
  check (storage_provider in ('supabase', 'r2'));

comment on column public.essay_source_files.storage_provider is
'Provedor que armazena o arquivo: Supabase Storage para registros legados ou Cloudflare R2.';

notify pgrst, 'reload schema';

commit;
