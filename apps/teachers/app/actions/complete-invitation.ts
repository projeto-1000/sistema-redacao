"use server";

import { createClient } from "@/lib/server";
import { passwordSetupSchema } from "@repo/validators";

interface CompleteInvitationInput {
  password: string;
  confirmPassword: string;
}

export async function completeTeacherInvitation(input: CompleteInvitationInput) {
  const parsed = passwordSetupSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.issues[0]?.message ?? "Senha inválida." };
  }

  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user || user.user_metadata?.teacher_invitation_pending !== true) {
    return { success: false as const, error: "Este convite é inválido ou já foi utilizado." };
  }

  const { data: role, error: roleError } = await supabase.rpc("get_my_role");
  if (roleError || role !== "TEACHER") {
    return { success: false as const, error: "Este convite não pertence a um professor." };
  }

  const { error: passwordError } = await supabase.auth.updateUser({
    password: parsed.data.password,
    data: { teacher_invitation_pending: false },
  });

  if (passwordError) {
    console.error("[TEACHER_INVITATION_PASSWORD_ERROR]", passwordError);
    return { success: false as const, error: "Não foi possível definir a senha. Tente novamente." };
  }

  return { success: true as const, redirectTo: "/inicio" };
}
