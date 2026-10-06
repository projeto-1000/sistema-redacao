export interface CancellationHistoryEntry {
  id: string;
  student_id: string;
  kind: "withdrawal" | "ordinary" | "support";
  status: string;
  requested_at: string;
  last_activity_at: string;
  effective_at: string | null;
  refund_started_at: string | null;
  refund_completed_at: string | null;
  cancellation_reason: string | null;
  cancellation_details: string | null;
  snapshot: {
    student_name: string | null;
    student_email: string | null;
    plan_name: string | null;
    amount: number | null;
    paid_at: string | null;
    credits_granted: number | null;
    credits_used: number | null;
    historical_reconstruction: boolean;
    support_action?: "cancel_only" | "cancel_refund" | "refund_courtesy" | "refund_only";
    administrator_name?: string;
    administrator_id?: string;
    refund_amount?: number;
    courtesy_credits?: number;
    courtesy_until?: string;
  };
  events: { label: string; at: string; detail?: string | null }[];
}

export interface CancellationHistoryGroup {
  studentId: string;
  identity: CancellationHistoryEntry["snapshot"];
  requestCount: number;
  lastActivityAt: string;
  latestStatus: string;
  requests: CancellationHistoryEntry[];
}
