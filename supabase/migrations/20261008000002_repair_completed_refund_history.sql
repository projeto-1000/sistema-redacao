begin;

-- Earlier checkouts could mark a completed support refund as "undone" when
-- reusing the same local subscription row. Keep the original event array in
-- the immutable repair snapshot while removing that false event from the
-- student-facing timeline. No subscription, balance or payment is changed.
with affected as (
  select
    history.id,
    history.events as original_events,
    history.status as original_status,
    operation.id as operation_id,
    coalesce((
      select jsonb_agg(event.value order by event.ordinality)
      from jsonb_array_elements(history.events) with ordinality as event(value, ordinality)
      where event.value ->> 'label' is distinct from 'Cancelamento desfeito'
    ), '[]'::jsonb) as valid_events
  from public.subscription_cancellation_history as history
  join public.subscription_support_operations as operation on operation.history_id = history.id
  where history.kind = 'support'
    and history.status = 'undone'
    and history.refund_completed_at is not null
    and operation.status = 'completed'
    and operation.refund_confirmed = true
    and operation.action in ('cancel_refund', 'refund_courtesy')
  for update of history
)
update public.subscription_cancellation_history as history
set
  status = 'refunded',
  last_activity_at = now(),
  snapshot = history.snapshot || jsonb_build_object(
    'history_repair', jsonb_build_object(
      'reason', 'completed_refund_misclassified_as_undone',
      'original_status', affected.original_status,
      'original_events', affected.original_events,
      'support_operation_id', affected.operation_id,
      'corrected_at', now()
    )
  ),
  events = affected.valid_events || jsonb_build_array(
    jsonb_build_object('label', 'Registro corrigido: reembolso confirmado', 'at', now())
  )
from affected
where history.id = affected.id;

commit;
