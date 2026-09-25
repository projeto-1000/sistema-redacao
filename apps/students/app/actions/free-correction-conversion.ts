"use server";

import { createClient } from "@/lib/server";

export type FreeCorrectionCampaignEventType = "impression" | "click" | "dismiss";
export type FreeCorrectionCampaignPlacement = "score_card" | "footer_banner";

interface TrackFreeCorrectionCampaignEventInput {
  essayId: string;
  eventType: FreeCorrectionCampaignEventType;
  placement: FreeCorrectionCampaignPlacement;
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const EVENT_TYPES = new Set<FreeCorrectionCampaignEventType>(["impression", "click", "dismiss"]);

const PLACEMENTS = new Set<FreeCorrectionCampaignPlacement>(["score_card", "footer_banner"]);

export async function trackFreeCorrectionCampaignEvent({
  essayId,
  eventType,
  placement,
}: TrackFreeCorrectionCampaignEventInput): Promise<boolean> {
  if (!UUID_PATTERN.test(essayId) || !EVENT_TYPES.has(eventType) || !PLACEMENTS.has(placement)) {
    return false;
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return false;
  }

  const { error } = await supabase.rpc("record_post_free_correction_campaign_event", {
    p_essay_id: essayId,
    p_event_type: eventType,
    p_placement: placement,
    p_metadata: {},
  });

  return error === null;
}
