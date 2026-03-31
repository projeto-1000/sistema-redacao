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

export type GetStudentsFilters = {
  search?: string;
  status?: string;
  plan?: string;
  from?: string;
  to?: string;
};

export type TeacherListItem = {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string;
  status: string;
  total: number;
  currentMonth: number;
};

export type GetTeachersFilters = {
  search?: string;
  status?: string;
};

export type TeacherStats = {
  monthStats: {
    total: number;
    onTime: number;
    late: number;
    trendText: string;
    isPositiveTrend: boolean;
  };
  totalStats: {
    total: number;
    onTime: number;
    late: number;
  };
};
