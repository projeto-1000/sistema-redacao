ALTER TABLE public.essay_topics
DROP CONSTRAINT IF EXISTS essay_topics_source_type_check;

UPDATE public.essay_topics
SET source_type = 'ENEM PPL/Reaplicação'
WHERE source_type = 'ENEM PPL';

ALTER TABLE public.essay_topics
ADD CONSTRAINT essay_topics_source_type_check
CHECK (
  source_type IN (
    'ENEM',
    'ENEM PPL/Reaplicação',
    'AUTORAL'
  )
);