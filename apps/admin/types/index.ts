import { EssayStatus } from "@repo/types";
import { ReactNode } from "react";

export type StudentsListItem = {
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
export interface PaymentMetrics {
  totalEssays: number;
  onTime: number;
  delayed: number;
  valuePerCorrection: number;
  dailyAverage: number;
  totalAmount: number;
  status: "paid" | "pending";
}

export type AccountMainType = "pix" | "bank_account";
export type PixType = "cpf" | "cnpj" | "phone" | "email" | "random";
export type BankAccountVariant = "corrente" | "poupanca";

export interface PaymentAccount {
  owner: ReactNode;
  id: string;
  teacher_id: string;
  type: AccountMainType;
  owner_name: string;
  owner_document: string;
  is_default: boolean;
  pix_type?: PixType;
  pix_key?: string;
  bank_name?: string;
  agency?: string;
  account_number?: string;
  account_variant?: BankAccountVariant;
}

export interface AccountData {
  id: string;
  is_default: boolean;
  type: "pix" | "bank_account";
  owner_name: string;
  owner_document: string;
  pix_key?: string;
  pix_type?: string;
  bank_name?: string;
  agency?: string;
  account_number?: string;
  account_variant?: string;
}
export interface PaymentHistoryItem {
  id: string;
  processed_at: string;
  billing_month: string;
  essays_count: number;
  total_amount: number;
  status: "paid" | "pending" | "processing";
  receipt_url?: string | null;
}
