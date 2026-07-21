"use server";

import {
  cancelScheduledPlanChangeService,
  getPlanDowngradePreviewService,
  schedulePlanDowngradeService,
} from "@/services/plan-change/downgrade";

import {
  executePlanUpgradeService,
  getPlanUpgradePreviewService,
} from "@/services/plan-change/upgrade";

import type {
  CancelScheduledPlanChangeResult,
  ExecutePlanUpgradeResult,
  PlanDowngradePreview,
  PlanUpgradePreview,
  SchedulePlanDowngradeResult,
} from "@/services/plan-change/types";

export type {
  CancelScheduledPlanChangeResult,
  ExecutePlanUpgradeResult,
  PlanDowngradePreview,
  PlanUpgradePreview,
  SchedulePlanDowngradeResult,
} from "@/services/plan-change/types";

export async function getPlanUpgradePreview(targetPlanId: string): Promise<PlanUpgradePreview> {
  return getPlanUpgradePreviewService(targetPlanId);
}

export async function executePlanUpgrade(targetPlanId: string): Promise<ExecutePlanUpgradeResult> {
  return executePlanUpgradeService(targetPlanId);
}

export async function getPlanDowngradePreview(
  targetPlanId: string
): Promise<PlanDowngradePreview | null> {
  return getPlanDowngradePreviewService(targetPlanId);
}

export async function schedulePlanDowngrade(
  targetPlanId: string
): Promise<SchedulePlanDowngradeResult> {
  return schedulePlanDowngradeService(targetPlanId);
}

export async function cancelScheduledPlanChange(): Promise<CancelScheduledPlanChangeResult> {
  return cancelScheduledPlanChangeService();
}
