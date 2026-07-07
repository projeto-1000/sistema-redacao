import type { EssayStatus, ThematicAxis } from "@repo/types";

export interface EssayListItem {
  id: string;
  title: string;
  submission_date: string;
  status: EssayStatus;
  total_score: number;
  thematic_axis: ThematicAxis;
  topic_id: string;
}

export interface EssaysFilter {
  search?: string;
  status?: EssayStatus | "all";
  thematicAxis?: ThematicAxis | "all";
  totalScore?: string | "all";
  from?: string;
  to?: string;
}

export interface EssayDraft {
  id?: string;
  content: string;
  updated_at: string;
}
