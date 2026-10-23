begin;

create table public.essay_source_files (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  topic_id uuid not null references public.essay_topics(id) on delete restrict,
  storage_path text not null unique,
  original_filename text not null check (char_length(original_filename) between 1 and 255),
  mime_type text not null check (mime_type in ('image/jpeg', 'application/pdf')),
  original_size_bytes bigint not null check (original_size_bytes > 0),
  stored_size_bytes bigint not null check (stored_size_bytes > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index essay_source_files_student_id_idx
  on public.essay_source_files (student_id);

create index essay_source_files_topic_id_idx
  on public.essay_source_files (topic_id);

alter table public.essays
  add column source_file_id uuid references public.essay_source_files(id) on delete set null;

alter table public.essay_backups
  add column source_file_id uuid references public.essay_source_files(id) on delete set null;

create index essays_source_file_id_idx on public.essays (source_file_id);
create index essay_backups_source_file_id_idx on public.essay_backups (source_file_id);

alter table public.essay_source_files enable row level security;

create policy "Students can read their own essay source files"
on public.essay_source_files for select
to authenticated
using (student_id = auth.uid() and public.get_my_role() = 'STUDENT');

create policy "Students can insert their own essay source files"
on public.essay_source_files for insert
to authenticated
with check (
  student_id = auth.uid()
  and storage_path like auth.uid()::text || '/%'
  and public.get_my_role() = 'STUDENT'
);

create policy "Students can delete their own unsubmitted essay source files"
on public.essay_source_files for delete
to authenticated
using (
  student_id = auth.uid()
  and public.get_my_role() = 'STUDENT'
  and not exists (
    select 1
    from public.essays
    where essays.source_file_id = essay_source_files.id
      and essays.status <> 'draft'
  )
);

grant select, insert, delete on public.essay_source_files to authenticated;
grant all privileges on public.essay_source_files to service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'essay-originals',
  'essay-originals',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'application/pdf']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Students upload their own essay source files"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'essay-originals'
  and (storage.foldername(name))[1] = auth.uid()::text
  and public.get_my_role() = 'STUDENT'
);

create policy "Students read their own essay source files"
on storage.objects for select
to authenticated
using (
  bucket_id = 'essay-originals'
  and (storage.foldername(name))[1] = auth.uid()::text
  and public.get_my_role() = 'STUDENT'
);

create policy "Students delete their own essay source files"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'essay-originals'
  and (storage.foldername(name))[1] = auth.uid()::text
  and public.get_my_role() = 'STUDENT'
);

create function public.submit_essay_with_source(
  p_student_id uuid,
  p_topic_id uuid,
  p_title text,
  p_thematic_axis text,
  p_content text,
  p_best_essay_consent boolean default false,
  p_source_file_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = 'public'
as $$
declare
  v_essay_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Usuário não autenticado.';
  end if;

  if auth.uid() <> p_student_id then
    raise exception 'Você não tem permissão para enviar uma redação para outro aluno.';
  end if;

  if p_source_file_id is not null and not exists (
    select 1
    from public.essay_source_files source_file
    where source_file.id = p_source_file_id
      and source_file.student_id = p_student_id
      and source_file.topic_id = p_topic_id
  ) then
    raise exception 'O arquivo original informado é inválido para esta redação.';
  end if;

  v_essay_id := public.submit_essay(
    p_student_id,
    p_topic_id,
    p_title,
    p_thematic_axis,
    p_content,
    p_best_essay_consent
  );

  if p_source_file_id is not null then
    update public.essays
    set source_file_id = p_source_file_id
    where id = v_essay_id;
  end if;

  return v_essay_id;
end;
$$;

revoke all on function public.submit_essay_with_source(uuid, uuid, text, text, text, boolean, uuid)
from public, anon, authenticated;

grant execute on function public.submit_essay_with_source(uuid, uuid, text, text, text, boolean, uuid)
to authenticated, service_role;

notify pgrst, 'reload schema';

commit;
