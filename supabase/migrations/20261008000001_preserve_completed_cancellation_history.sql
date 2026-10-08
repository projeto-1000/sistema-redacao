begin;

-- A new paid contract is not an undo of a completed refund. Courtesy expiry
-- closes access without changing the recorded financial outcome.
create or replace function public.record_ordinary_cancellation_history()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_status text; v_event_at timestamptz; v_support public.subscription_support_operations%rowtype;
begin
  if old.cancellation_metadata ->> 'source' = 'admin_support'
    and (new.cancel_at_period_end or new.status = 'canceled') and old.cancel_at_period_end
    and new.external_id = old.external_id
    and new.cancellation_requested_at = old.cancellation_requested_at then
    select * into v_support from public.subscription_support_operations
      where id::text = old.cancellation_metadata ->> 'support_operation_id';
    if found then
      update public.subscription_cancellation_history set
        effective_at = new.cancellation_effective_at,
        provider_canceled_at = new.provider_canceled_at,
        status = case when v_support.status = 'completed' and v_support.action = 'cancel_only'
          then case when new.status = 'canceled' then 'canceled' else 'scheduled' end else status end,
        last_activity_at = case when new.status = 'canceled' and old.status is distinct from 'canceled'
          then now() else last_activity_at end,
        events = events || case when new.status = 'canceled' and old.status is distinct from 'canceled'
          then jsonb_build_array(jsonb_build_object('label','Acesso encerrado','at',now())) else '[]'::jsonb end
        where id = v_support.history_id;
      return new;
    end if;
  end if;
  if old.cancellation_mode = 'end_of_period' and old.cancel_at_period_end
    and new.cancellation_mode = 'end_of_period' and new.cancel_at_period_end
    and new.external_id = old.external_id and old.cancellation_requested_at is not null then
    new.cancellation_requested_at := old.cancellation_requested_at;
  end if;
  if new.cancellation_mode = 'end_of_period' and new.cancellation_requested_at is not null then
    v_status := case when new.status = 'canceled' then 'canceled'
      when new.cancellation_provider_status = 'pending' then 'provider_pending' else 'scheduled' end;
    v_event_at := greatest(new.cancellation_requested_at,
      coalesce(new.provider_canceled_at,new.cancellation_requested_at),
      coalesce(new.canceled_at,new.cancellation_requested_at));
    insert into public.subscription_cancellation_history(student_id,subscription_id,provider_subscription_id,kind,
      requested_at,last_activity_at,status,effective_at,provider_canceled_at,cancellation_reason,cancellation_details,snapshot,events)
      values(new.user_id,new.id,new.external_id,'ordinary',new.cancellation_requested_at,v_event_at,v_status,
        new.cancellation_effective_at,new.provider_canceled_at,new.cancellation_reason,new.cancellation_metadata ->> 'details',
        public.capture_cancellation_snapshot(new.id,new.external_id,new.cancellation_requested_at),
        jsonb_build_array(jsonb_build_object('label','Cancelamento solicitado','at',new.cancellation_requested_at)))
      on conflict(subscription_id,provider_subscription_id,requested_at) do update set
        status = excluded.status,effective_at = excluded.effective_at,provider_canceled_at = excluded.provider_canceled_at,
        last_activity_at = greatest(subscription_cancellation_history.last_activity_at,excluded.last_activity_at),
        events = subscription_cancellation_history.events || case
          when subscription_cancellation_history.status is distinct from excluded.status then
            jsonb_build_array(jsonb_build_object('label',case excluded.status when 'canceled' then 'Acesso encerrado'
              when 'scheduled' then 'Renovação interrompida' else 'Confirmação do provedor pendente' end,'at',v_event_at))
          else '[]'::jsonb end;
  elsif old.status = 'active' and old.cancel_at_period_end
    and old.cancellation_mode = 'end_of_period' and old.cancellation_requested_at is not null
    and not new.cancel_at_period_end then
    update public.subscription_cancellation_history set status = 'undone',last_activity_at = now(),
      events = events || jsonb_build_array(jsonb_build_object('label','Cancelamento desfeito','at',now()))
      where subscription_id = old.id and provider_subscription_id = old.external_id
        and requested_at = old.cancellation_requested_at
        and status in ('scheduled','provider_pending') and refund_completed_at is null;
  end if;
  return new;
end; $$;

commit;
