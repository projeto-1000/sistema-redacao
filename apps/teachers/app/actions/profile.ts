"use server";

import { createClient } from "@/lib/server";
import { getPublicStorageObjectPath } from "@repo/utils";
import { passwordSchema } from "@repo/validators";
import { revalidatePath } from "next/cache";

export async function getProfileData() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, role, onboarding_completed, correction_review_required")
    .eq("id", user.id)
    .single();

  return {
    user: {
      id: profile?.id ?? user.id,
      name: profile?.full_name || user.user_metadata?.full_name || "Professor",
      email: user.email ?? "",
      credits: 0,
      avatarUrl: profile?.avatar_url || null,
      role: profile?.role ?? "TEACHER",
      onboarding_completed: profile?.onboarding_completed ?? true,
      correction_review_required: profile?.correction_review_required ?? false,
    },
  };
}

export async function updateProfile({ name }: { name: string }) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) throw new Error("Usuário não autenticado");

  const { error } = await supabase.from("profiles").update({ full_name: name }).eq("id", user.id);

  if (error) {
    console.error("Erro ao atualizar perfil:", error);
    throw new Error("Não foi possível atualizar o perfil");
  }

  revalidatePath("/perfil");
  revalidatePath("/perfil/editar");
}

export async function updatePassword(password: string) {
  const parsedPassword = passwordSchema.safeParse(password);

  if (!parsedPassword.success) {
    return {
      success: false,
      error: parsedPassword.error.issues[0]?.message ?? "Senha inválida.",
    };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.updateUser({
    password: parsedPassword.data,
  });

  if (error) {
    console.error("Erro ao atualizar senha:", error);

    return {
      success: false,
      error: "Não foi possível atualizar a senha",
    };
  }

  return {
    success: true,
  };
}

export async function uploadAvatar(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) throw new Error("Usuário não autenticado");

  const file = formData.get("file") as File;
  if (!file) throw new Error("Nenhum arquivo enviado");

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("avatar_url")
    .eq("id", user.id)
    .single();

  if (profileError) {
    console.error("Erro ao localizar a foto atual:", profileError);
    throw new Error("Falha ao localizar a foto atual");
  }

  const previousAvatarPath = getPublicStorageObjectPath(profile.avatar_url, "avatars", user.id);

  const fileExt = file.name.split(".").pop();
  const fileName = `${user.id}/${Date.now()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage.from("avatars").upload(fileName, file, {
    upsert: true,
    contentType: file.type,
  });

  if (uploadError) {
    console.error("Erro no storage:", uploadError);
    throw new Error("Falha ao salvar a imagem");
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("avatars").getPublicUrl(fileName);

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ avatar_url: publicUrl })
    .eq("id", user.id);

  if (updateError) {
    const { error: rollbackError } = await supabase.storage.from("avatars").remove([fileName]);

    if (rollbackError) {
      console.error("Erro ao remover a nova foto após falha no perfil:", rollbackError);
    }

    console.error("Erro ao vincular imagem:", updateError);
    throw new Error("Falha ao atualizar a foto no perfil");
  }

  if (previousAvatarPath && previousAvatarPath !== fileName) {
    const { error: deleteError } = await supabase.storage
      .from("avatars")
      .remove([previousAvatarPath]);

    if (deleteError) {
      console.error("Erro ao remover a foto anterior:", deleteError);
    }
  }

  revalidatePath("/perfil");
  revalidatePath("/perfil/editar");

  return { success: true, avatarUrl: publicUrl };
}
