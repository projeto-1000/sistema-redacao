export type StudentListItem = {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  status: "active" | "inactive" | "blocked";
  plan?: string;
  creditsProf?: number;
  creditsIA?: number;
  validityStart?: string;
  validityEnd?: string;
  validityType?: string;
};
