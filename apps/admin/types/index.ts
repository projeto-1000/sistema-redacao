import { EssayStatus } from "@repo/types";
export type {
  TeacherPaymentAccount as PaymentAccount,
  TeacherPaymentAccount as AccountData,
  TeacherPaymentHistoryItem as PaymentHistoryItem,
  TeacherPaymentMetrics as PaymentMetrics,
} from "@repo/types";

export type StudentsListItem = {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  status: "active" | "inactive" | "blocked";
  created_at: string;

  plan: {
    name: string;
    interval: string;
    interval_count: number | null;
  } | null;

  subscription: {
    status: string;
    current_period_start: string | null;
    current_period_end: string | null;
  } | null;

  credits: {
    plan: number;
    extra: number;
    free: number;
    mentorship: number;
  };

  last_activity: {
    date: string;
    type: "submission" | "correction";
  } | null;
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

export type TeacherChartData = {
  range: string;
  count: number;
};

export type AverageTimeRange = "current_month" | "30d" | "60d" | "90d";

export type TeacherEssayListItem = {
  id: string;
  student_id: string;
  student_name: string;
  student_email: string;
  student_avatar: string | null;
  title: string;
  thematic_axis: string;
  total_score: number;
  status: string;
  is_on_late: boolean;
  correction_date: string;
  created_at?: string;
  due_date?: string;
};

export type TeacherEssayFilters = {
  search?: string;
  status?: string;
  delivery?: string;
  is_on_time?: string;
  from?: string;
  to?: string;
};

export type StudentEssaysFilters = {
  search?: string;
  status?: string;
  is_on_time?: string;
  from?: string;
  to?: string;
};

export type TeachersFilters = {
  search?: string;
  status?: string;
  delivery?: string;
  from?: string;
  to?: string;
};

export interface StudentEssayItem {
  id: string;
  title: string;
  thematic_axis: string;
  status: EssayStatus;
  total_score: number;
  created_at: string;
}
