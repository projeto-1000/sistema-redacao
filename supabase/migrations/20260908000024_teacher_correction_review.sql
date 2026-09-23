begin;

alter table public.profiles
    add column correction_review_required boolean not null default false;

alter table public.profiles
    alter column phone drop not null;

-- Only teachers may initially have no phone number. Existing requirements remain
-- unchanged for students and other roles.
alter table public.profiles
    add constraint profiles_phone_required_for_non_teachers_check
    check (
        (role = 'TEACHER'::public.app_role) is true
        or phone is not null
    );

create table public.correction_review_submissions (
    id uuid primary key default gen_random_uuid(),
    essay_id uuid not null
        references public.essays(id)
        on delete cascade,
    teacher_id uuid not null
        references public.profiles(id),
    round_number integer not null,
    payload jsonb not null,
    status text not null,
    submitted_at timestamptz not null default now(),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint correction_review_submissions_essay_round_unique
        unique (essay_id, round_number),
    constraint correction_review_submissions_round_number_positive_check
        check (round_number > 0),
    constraint correction_review_submissions_status_check
        check (
            status in (
                'pending_review',
                'returned_to_teacher',
                'approved',
                'approved_with_changes'
            )
        )
);

comment on table public.correction_review_submissions is
    'Historical teacher correction submissions awaiting or completing administrative review.';

comment on column public.correction_review_submissions.status is
    'Review workflow status. returned_to_teacher is distinct from essays.status = returned, which means returned to the student.';

comment on column public.correction_review_submissions.payload is
    'Frozen correction payload submitted by the teacher for this review round.';

create index correction_review_submissions_essay_id_idx
    on public.correction_review_submissions (essay_id);

create index correction_review_submissions_teacher_id_idx
    on public.correction_review_submissions (teacher_id);

create index correction_review_submissions_status_idx
    on public.correction_review_submissions (status);

create index correction_review_submissions_admin_queue_idx
    on public.correction_review_submissions (status, submitted_at);

create table public.correction_review_actions (
    id uuid primary key default gen_random_uuid(),
    submission_id uuid not null
        references public.correction_review_submissions(id)
        on delete cascade,
    admin_id uuid not null
        references public.profiles(id),
    action text not null,
    changes jsonb not null default '{}'::jsonb,
    feedback text,
    created_at timestamptz not null default now(),
    constraint correction_review_actions_submission_unique
        unique (submission_id),
    constraint correction_review_actions_action_check
        check (
            action in (
                'approved',
                'approved_with_changes',
                'returned_to_teacher'
            )
        ),
    constraint correction_review_actions_changes_object_check
        check (jsonb_typeof(changes) = 'object'),
    constraint correction_review_actions_return_feedback_check
        check (
            action <> 'returned_to_teacher'
            or nullif(btrim(feedback), '') is not null
        ),
    constraint correction_review_actions_approved_changes_check
        check (
            action <> 'approved_with_changes'
            or changes <> '{}'::jsonb
        )
);

comment on table public.correction_review_actions is
    'Immutable administrative audit trail for correction review decisions.';

comment on column public.correction_review_actions.action is
    'returned_to_teacher returns a correction to its teacher; it never means essays.status = returned.';

comment on column public.correction_review_actions.changes is
    'Field-level administrative changes recorded for the review decision.';

create index correction_review_actions_admin_id_idx
    on public.correction_review_actions (admin_id);

create index correction_review_actions_created_at_idx
    on public.correction_review_actions (created_at);

alter table public.correction_review_submissions enable row level security;
alter table public.correction_review_actions enable row level security;

grant select, insert
    on table public.correction_review_submissions
    to authenticated;

grant select, insert
    on table public.correction_review_actions
    to authenticated;

grant all privileges
    on table public.correction_review_submissions, public.correction_review_actions
    to service_role;

create policy "Admins read correction review submissions"
on public.correction_review_submissions for select
to authenticated
using (public.get_my_role() = 'ADMIN');

create policy "Admins create correction review submissions"
on public.correction_review_submissions for insert
to authenticated
with check (public.get_my_role() = 'ADMIN');

create policy "Teachers read their own correction review submissions"
on public.correction_review_submissions for select
to authenticated
using (
    public.get_my_role() = 'TEACHER'
    and teacher_id = auth.uid()
);

create policy "Admins read correction review actions"
on public.correction_review_actions for select
to authenticated
using (public.get_my_role() = 'ADMIN');

create policy "Admins create correction review actions"
on public.correction_review_actions for insert
to authenticated
with check (
    public.get_my_role() = 'ADMIN'
    and admin_id = auth.uid()
);

create policy "Teachers read actions for their own correction submissions"
on public.correction_review_actions for select
to authenticated
using (
    public.get_my_role() = 'TEACHER'
    and exists (
        select 1
        from public.correction_review_submissions as submission
        where submission.id = submission_id
          and submission.teacher_id = auth.uid()
    )
);

-- No student policies are intentionally defined. Teachers receive read-only
-- access, and review actions have no UPDATE or DELETE policy for any app role.
-- In the future supervised flow, essays.status becomes corrected only after
-- administrative approval; this migration does not change essays.status.

commit;
