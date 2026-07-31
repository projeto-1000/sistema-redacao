"use server";

import { createClient } from "@/lib/server";
import { onboardingSchema, type OnboardingSchema } from "@repo/validators";
import { revalidatePath } from "next/cache";

interface CompleteStudentOnboardingRpcResult {
  acquisitionChannel: string;
  hasActiveFreeCredit: boolean;
  freeCreditExpiresAt: string | null;
}

type CompleteStudentOnboardingResult =
  | {
      success: true;
      nextStep: "HOTMART_MENTORSHIP_REMINDER";
      freeCreditExpiresAt: null;
    }
  | {
      success: true;
      nextStep: "FREE_CREDIT_REMINDER";
      freeCreditExpiresAt: string;
    }
  | {
      success: true;
      nextStep: "DONE";
      freeCreditExpiresAt: null;
    }
  | {
      success: false;
      error: string;
    };

function isCompleteStudentOnboardingRpcResult(
  value: unknown
): value is CompleteStudentOnboardingRpcResult {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const result = value as Record<string, unknown>;

  if (
    typeof result.acquisitionChannel !== "string" ||
    typeof result.hasActiveFreeCredit !== "boolean"
  ) {
    return false;
  }

  if (result.hasActiveFreeCredit) {
    return typeof result.freeCreditExpiresAt === "string";
  }

  return result.freeCreditExpiresAt === null;
}

export async function completeStudentOnboarding(
  rawData: OnboardingSchema
): Promise<CompleteStudentOnboardingResult> {
  try {
    const parsed = onboardingSchema.safeParse(rawData);

    if (!parsed.success) {
      return {
        success: false,
        error: "Dados inválidos.",
      };
    }

    const data = parsed.data;
    const supabase = await createClient();

    const { data: onboardingResult, error } = await supabase.rpc("complete_student_onboarding", {
      p_education_level: data.educationLevel,
      p_school_type: data.schoolType,
      p_desired_course: data.knowsCourse === "yes" ? data.course : null,
      p_state: data.state,
      p_city: data.city,
    });

    if (error) {
      console.error("[COMPLETE_STUDENT_ONBOARDING_ERROR]", error);

      return {
        success: false,
        error: "Erro ao finalizar o onboarding.",
      };
    }

    if (!isCompleteStudentOnboardingRpcResult(onboardingResult)) {
      console.error("[INVALID_COMPLETE_STUDENT_ONBOARDING_RESULT]", onboardingResult);

      return {
        success: false,
        error: "Não foi possível determinar os próximos passos do onboarding.",
      };
    }

    revalidatePath("/", "layout");

    if (onboardingResult.acquisitionChannel === "HOTMART_MENTORIA") {
      return {
        success: true,
        nextStep: "HOTMART_MENTORSHIP_REMINDER",
        freeCreditExpiresAt: null,
      };
    }

    if (onboardingResult.hasActiveFreeCredit && onboardingResult.freeCreditExpiresAt) {
      return {
        success: true,
        nextStep: "FREE_CREDIT_REMINDER",
        freeCreditExpiresAt: onboardingResult.freeCreditExpiresAt,
      };
    }

    return {
      success: true,
      nextStep: "DONE",
      freeCreditExpiresAt: null,
    };
  } catch (error) {
    console.error("[COMPLETE_STUDENT_ONBOARDING_FATAL_ERROR]", error);

    return {
      success: false,
      error: "Erro interno no servidor.",
    };
  }
}
