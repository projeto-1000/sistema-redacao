begin;

alter table public.essays
add column best_essay_consent boolean not null default false;

comment on column public.essays.best_essay_consent is
'Consentimento do aluno para eventual uso anonimizado da redação no banco de melhores redações.';

create function public.submit_essay(
    p_student_id uuid,
    p_topic_id uuid,
    p_title text,
    p_thematic_axis text,
    p_content text,
    p_best_essay_consent boolean
)
returns uuid
language plpgsql
security definer
set search_path = 'public'
as $$
declare
    v_essay_id uuid;
begin
    v_essay_id := public.submit_essay(
        p_student_id,
        p_topic_id,
        p_title,
        p_thematic_axis,
        p_content
    );

    update public.essays
    set best_essay_consent = coalesce(p_best_essay_consent, false)
    where id = v_essay_id
      and student_id = p_student_id;

    return v_essay_id;
end;
$$;

revoke all on function public.submit_essay(uuid, uuid, text, text, text, boolean)
from public, anon, authenticated;

grant execute on function public.submit_essay(uuid, uuid, text, text, text, boolean)
to authenticated, service_role;

commit;
