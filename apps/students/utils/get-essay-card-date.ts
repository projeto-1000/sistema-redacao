import type { EssayListItem } from "@/types";

export type EssayCardListItem = Omit<EssayListItem, "submission_date"> & {
  created_at: string | null;
  submission_date: string | null;
  correction_date: string | null;
  updated_at: string | null;
};

interface EssayCardDate {
  label: string;
  date: string | null;
}

export function getEssayCardDate(essay: EssayCardListItem): EssayCardDate {
  switch (essay.status) {
    case "draft":
      return {
        label: "Iniciada em",
        date: essay.created_at,
      };

    case "pending":
    case "correcting":
      return {
        label: "Enviada em",
        date: essay.submission_date,
      };

    case "corrected":
      return {
        label: "Corrigida em",
        date: essay.correction_date,
      };

    case "returned":
      return {
        label: "Devolvida em",
        date: essay.updated_at,
      };

    default:
      return {
        label: "Data indisponível",
        date: null,
      };
  }
}
