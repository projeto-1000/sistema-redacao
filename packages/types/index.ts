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
  onboarding_completed?: boolean | null
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
export interface CorrectionPayload {
  scores: Record<string, number>;
  comments: Record<string, string>;
  general_comment: string;
  highlights: {
    id: string;
    text: string;
    compId: string;
  }[];
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

export type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'canceled' | 'unpaid';

export type PlanTier = 'basic' | 'premium' | 'none';

export interface StudentSubscription {
  tier: PlanTier;
  status: SubscriptionStatus;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  remaining_essays: number;
  extra_credits: number;
}

export interface StudentProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  created_at: string;
  status: UserStatus;
  credits_balance: number;
  avatar_url: string | null;
  subscription: StudentSubscription;
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