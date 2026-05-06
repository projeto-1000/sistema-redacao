"use server";

import { createClient } from "@/lib/server";
import { onboardingSchema, type OnboardingSchema } from "@repo/validators";
import { revalidatePath } from "next/cache";

export async function completeStudentOnboarding(rawData: OnboardingSchema) {
  try {
    const parsed = onboardingSchema.safeParse(rawData);

    if (!parsed.success) {
      return { success: false, error: "Dados inválidos." };
    }
    const data = parsed.data;

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Usuário não autenticado." };
    }

    const { error: detailsError } = await supabase.from("student_details").insert({
      id: user.id,
      education_level: data.educationLevel,
      school_type: data.schoolType,
      desired_course: data.knowsCourse === "yes" ? data.course : null,
      state: data.state,
      city: data.city,
    });

    if (detailsError) {
      console.error("Erro ao inserir detalhes:", detailsError);
      return { success: false, error: "Erro ao salvar detalhes do aluno." };
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .update({ onboarding_completed: true })
      .eq("id", user.id);

    if (profileError) {
      console.error("Erro ao atualizar perfil:", profileError);
      return { success: false, error: "Erro ao finalizar o onboarding." };
    }

    revalidatePath("/", "layout");

    return { success: true };
  } catch (error) {
    console.error("Erro fatal no onboarding:", error);
    return { success: false, error: "Erro interno no servidor." };
  }
}
