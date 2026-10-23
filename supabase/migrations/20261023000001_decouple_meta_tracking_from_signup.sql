begin;

-- Tracking must never participate in account creation. Preserve all queued events.
-- The application writes to the outbox only after Auth confirms the new account.
drop trigger if exists queue_student_meta_registration on public.profiles;
drop function if exists public.queue_meta_registration_event();

commit;
