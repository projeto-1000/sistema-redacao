"use server";

import { createClient } from "@/lib/server";

export async function updatePassword(password: string) {
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    console.error("Erro ao atualizar senha:", error);

    return {
      success: false,
      error: "Não foi possível atualizar a senha",
    };
  }

  return { success: true };
}
