"use server";

import { createClient } from "@/lib/server";
import { onboardingSchema, type OnboardingSchema } from "@repo/validators";
import { revalidatePath } from "next/cache";

type CompleteStudentOnboardingResult =
  | {
      success: true;
      nextStep: "DONE" | "HOTMART_MENTORSHIP_REMINDER";
    }
  | {
      success: false;
      error: string;
    };

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

    const { data: acquisitionChannel, error } = await supabase.rpc("complete_student_onboarding", {
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

    revalidatePath("/", "layout");

    return {
      success: true,
      nextStep: acquisitionChannel === "HOTMART_MENTORIA" ? "HOTMART_MENTORSHIP_REMINDER" : "DONE",
    };
  } catch (error) {
    console.error("[COMPLETE_STUDENT_ONBOARDING_FATAL_ERROR]", error);

    return {
      success: false,
      error: "Erro interno no servidor.",
    };
  }
}
