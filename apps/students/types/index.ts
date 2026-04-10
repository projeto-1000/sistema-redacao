import { EssayStatus } from "@repo/types";

export interface EssayListItem {
  id: string;
  title: string;
  submission_date: string;
  status: EssayStatus;
  total_score: number;
  thematic_axis: string;
}

export interface EssaysFilter {
  search?: string;
  status?: string;
  totalScore?: string;
  thematicAxis?: string;
  from?: string;
  to?: string;
}
