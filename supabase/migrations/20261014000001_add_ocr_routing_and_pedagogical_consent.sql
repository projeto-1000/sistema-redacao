begin;

alter table public.essays
  add column pedagogical_use_consent boolean not null default false;

comment on column public.essays.pedagogical_use_consent is
'Consentimento do aluno para uso anonimizado da redação e do manuscrito em aulas e materiais pedagógicos.';

alter table public.essay_source_files
  add column transcription_model text,
  add column transcription_route text[],
  add column transcription_metadata jsonb,
  add column transcribed_at timestamptz;

alter table public.essay_source_files
  drop constraint if exists essay_source_files_mime_type_check;

alter table public.essay_source_files
  add constraint essay_source_files_mime_type_check
  check (mime_type in ('image/jpeg', 'image/png', 'application/pdf'));

drop function if exists public.submit_essay_with_source(
  uuid, uuid, text, text, text, boolean, uuid
);

create function public.submit_essay_with_source(
  p_student_id uuid,
  p_topic_id uuid,
  p_title text,
  p_thematic_axis text,
  p_content text,
  p_best_essay_consent boolean default false,
  p_pedagogical_use_consent boolean default false,
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

  update public.essays
  set
    source_file_id = p_source_file_id,
    pedagogical_use_consent = coalesce(p_pedagogical_use_consent, false)
  where id = v_essay_id;

  return v_essay_id;
end;
$$;

revoke all on function public.submit_essay_with_source(
  uuid, uuid, text, text, text, boolean, boolean, uuid
)
from public, anon, authenticated;

grant execute on function public.submit_essay_with_source(
  uuid, uuid, text, text, text, boolean, boolean, uuid
)
to authenticated, service_role;

create function public.record_essay_source_transcription(
  p_source_file_id uuid,
  p_model text,
  p_route text[],
  p_metadata jsonb
)
returns void
language plpgsql
security definer
set search_path = 'public'
as $$
begin
  if p_model is null or char_length(p_model) > 100 then
    raise exception 'Modelo de transcrição inválido.';
  end if;

  if p_route is null or cardinality(p_route) < 1 or cardinality(p_route) > 3 then
    raise exception 'Rota de transcrição inválida.';
  end if;

  if exists (
    select 1
    from unnest(p_route) as route_model
    where route_model is null or char_length(route_model) > 100
  ) then
    raise exception 'Rota de transcrição inválida.';
  end if;

  if p_metadata is not null and pg_column_size(p_metadata) > 16384 then
    raise exception 'Metadados de transcrição excedem o limite permitido.';
  end if;

  if auth.uid() is null then
    raise exception 'Usuário não autenticado.';
  end if;

  update public.essay_source_files
  set
    transcription_model = left(p_model, 100),
    transcription_route = p_route,
    transcription_metadata = p_metadata,
    transcribed_at = now(),
    updated_at = now()
  where id = p_source_file_id
    and student_id = auth.uid();

  if not found then
    raise exception 'Arquivo de redação não encontrado.';
  end if;
end;
$$;

revoke all on function public.record_essay_source_transcription(uuid, text, text[], jsonb)
from public, anon, authenticated;

grant execute on function public.record_essay_source_transcription(uuid, text, text[], jsonb)
to authenticated, service_role;

notify pgrst, 'reload schema';

commit;
