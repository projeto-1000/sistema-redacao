export type ThematicAxis =
  | 'Meio Ambiente'
  | 'Questões Sociais'
  | 'Saúde'
  | 'Cultura'
  | 'Direitos e Cidadania'
  | 'Educação'
  | 'Tecnologia'
  | 'Economia';
export interface MotivationalText {
  id: string;
  topic_id: string;
  text_number: number;
  body_text: string | null;
  image_url: string | null;
  source_reference: string | null;
}
export interface EssayTopic {
  id: string;
  title: string;
  axis: ThematicAxis;
  source_type: 'ENEM' | 'AUTORAL' | 'ENEM PPL';
  source_year: number | null;
  active: boolean;
  created_at: string;
}
export interface EssayTopicDetail extends EssayTopic {
  motivational_texts: MotivationalText[];
}

export type UserRole = "STUDENT" | "ADMIN" | "TEACHER";

export type UserStatus = "active" | "inactive" | "blocked" | "pending";
export interface UserData {
  name: string;
  email: string;
  credits: number;
  avatarUrl: string | null;
  role: UserRole
  onboarding_completed: boolean
}

export type EssayStatus = "draft" | "pending" | "correcting" | "corrected" | "returned" | "draft";

export interface Essay {
  id: string;
  student_id: string;
  title: string;
  thematic_axis: string;
  content: string;
  submission_date: string;
  status: EssayStatus;
  credit_cost: number;
  teacher_id: string | null;
  correction_date: string | null;
  general_comment: string | null;
  score_c1: number;
  score_c2: number;
  score_c3: number;
  score_c4: number;
  score_c5: number;
  total_score: number;
  comment_c1: string | null;
  comment_c2: string | null;
  comment_c3: string | null;
  comment_c4: string | null;
  comment_c5: string | null;
  created_at: string;
  updated_at: string;
}

export interface Competencies {
  id: number
  name: string;
  description: string;
  score: number;
  comment: string | null;
}
// export interface CorrectionPayload {
//   scores: Record<string, number>;
//   comments: Record<string, string>;
//   general_comment: string;
//   highlights: {
//     id: string;
//     text: string;
//     compId: string;
//   }[];
// }

export type CorrectionCompetencyId =
  | "c1"
  | "c2"
  | "c3"
  | "c4"
  | "c5";

export interface CorrectionHighlight {
  id: string;
  text: string;
  compId: string;
  startIndex: number;
  endIndex: number;
}

export interface CorrectionPayload {
  scores: Record<CorrectionCompetencyId, number>;
  comments: Record<CorrectionCompetencyId, string>;
  general_comment: string;
  main_bottleneck: string;
  next_essay_priorities: string[];
  rewrite_tasks: string[];
  highlights: CorrectionHighlight[];
}

export type EssayType = {
  id: string;
  student: string;
  topic: string;
  submissionDate: string;
  deadline: string;
  status: "urgent" | "warning" | "normal" | "expired";
  deadlineLabel: string;
};

export type DeadlineStatus = "urgent" | "warning" | "normal" | "expired";

export interface DeadlineInfo {
  status: DeadlineStatus;
  label: string;
  text: string;
}

export interface PendingEssaysFilter {
  search?: string;
  from?: string;
  to?: string;
}

export interface GradedEssaysFilter {
  search?: string;
  thematic_axis?: string;
  from?: string;
  to?: string;
}
export interface PendingEssayListItem {
  id: string,
  title: string
  created_at: string
  due_date: string
  submission_date: string
  student_name: string
  avatar_url: string
  email?: string
  status?: string
  teacher_name?: string
  teacher_avatar?: string
}

export interface GradedEssayListItem {
  id: string,
  title: string
  correction_date: string
  total_score: number
  student_name: string
  avatar_url: string
  teacher_name?: string
}

export interface StudentsFilter {
  search?: string;
  status?: string;
  from?: string;
  to?: string;
}

export type SubscriptionStatus =
  | "active"
  | "trial"
  | "past_due"
  | "canceled"
  | "unpaid";

export interface StudentSubscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: SubscriptionStatus;

  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  next_billing_at: string | null;

  pending_plan_id: string | null;
  pending_change_type: "downgrade" | null;
  pending_change_at: string | null;
  pending_plan_name: string | null;

  cancellation_requested_at: string | null;
  cancellation_effective_at: string | null;
  cancellation_reason: string | null;
  cancellation_provider_status: string | null;
  provider_canceled_at: string | null;
  canceled_at: string | null;

  created_at: string;
  updated_at: string;

  plan_name: string;
  plan_external_id: string | null;

  interval:
    | "day"
    | "week"
    | "month"
    | "year"
    | "lifetime";

  interval_count: number | null;

  price: number;
  credits_included: number;

  mentorship_cycle_number: number | null;
  mentorship_cycle_remaining: number | null;
  mentorship_cycle_total: number | null;
  mentorship_cycle_end: string | null;
}
export interface StudentCredits {
  free_credits: number;
  free_credit_expires_at: string | null;
  plan_credits: number
  extra_credits: number
  total_credits: number
  renew_date: string
}
export interface StudentProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  created_at: string;
  status: UserStatus;
  avatar_url: string | null;
  subscription: StudentSubscription;
  credits: StudentCredits;
}

export interface TeacherProfile {
  id: string;
  full_name: string;
  status: string;
  created_at: string;
  email: string;
  avatar_url: string;
}

export interface TopicsFilter {
  search?: string;
  axis?: ThematicAxis | "Todos";
}
export interface Plans {
  id: string;
  name: string;
  description: string | null;
  features: string[] | null;
  external_id: string | null;
  credits_included: number;
  credits_expiration_days: number;
  trial_days: number;
  interval: "day" | "week" | "month" | "year" | "lifetime";
  interval_count: number | null; 
  price: number; 
  payment_methods: string[];
  statement_descriptor: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type TransactionType = 
  | "plan_renewal"
  | "standalone_purchase"
  | "essay_usage"
  | "plan_change"
  | "administrative_adjustment"
  | "new_subscription"
  | "subscription_reactivation"
  | "mentorship_bonus"
  | "essay_refund"
  | "mentorship_expiration"
  | "free_trial_grant"
  | "plan_expiration"
  | "free_credit_expiration";

  export interface CreditTransaction {
  id: string;
  user_id: string;
  type: TransactionType;
  amount: number;
  description: string;
  metadata?: {
    price?: number;
    essay_id?: string;
    transaction_id?: string;
    [key: string]: any;
  } | null;
  created_at: string;
}

export type SubscriptionHistoryEvent =
  | SubscriptionHistoryCreditEvent
  | SubscriptionHistoryPaymentEvent;

export interface SubscriptionHistoryCreditEvent {
  kind: "credit_transaction";

  id: string;
  user_id: string;

  created_at: string;

  transaction_type: TransactionType;
  amount: number;
  description: string | null;

  student_payment_id: string | null;

  metadata: Record<string, unknown> | null;
}

export interface SubscriptionHistoryPaymentEvent {
  kind: "payment";

  id: string;
  user_id: string;

  created_at: string;
  paid_at: string | null;

  amount_in_cents: number;
  credits_amount: number | null;

  status: string;
  payment_method: string | null;

  plan_id: string | null;
  plan_name: string | null;

  subscription_id: string | null;

  metadata: Record<string, unknown> | null;
}

export type HistoryItemCategory =
  | "credit_grant"
  | "credit_usage"
  | "credit_expiration"
  | "payment"
  | "refund"
  | "adjustment";

export type HistoryValueTone =
  | "positive"
  | "negative"
  | "neutral"
  | "warning";

export interface HistoryDisplayItem {
  id: string;

  title: string;
  description: string | null;

  createdAt: string;

  primaryValue: string;
  secondaryValue: string | null;

  category: HistoryItemCategory;
  valueTone: HistoryValueTone;
}

export interface CreditsFilters {
  type?: TransactionType;
  from?: string;
  to?: string;
}

export interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price: number;
  popular?: boolean;
}
export interface SubscriptionHistoryRpcRow {
  kind: "credit_transaction" | "payment";

  id: string;
  user_id: string;
  created_at: string;

  transaction_type: TransactionType | null;
  credit_amount: number | null;
  description: string | null;
  student_payment_id: string | null;

  paid_at: string | null;
  amount_in_cents: number | null;
  credits_amount: number | null;
  payment_status: string | null;
  payment_method: string | null;

  plan_id: string | null;
  plan_name: string | null;
  subscription_id: string | null;

  metadata: Record<string, unknown> | null;

  /*
   * PostgreSQL bigint pode chegar como número
   * ou string, dependendo da configuração.
   */
  total_count: number | string | null;
}