begin;

alter table public.essays
add column best_essay_consent boolean not null default false;

comment on column public.essays.best_essay_consent is
'Consentimento do aluno para eventual uso anonimizado da redação no banco de melhores redações.';

commit;
