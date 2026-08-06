"use server";

import { UserData } from "@repo/types";
import { createClient } from "@/lib/server";
import { revalidatePath } from "next/cache";

export async function getProfileData() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, avatar_url")
    .eq("id", user.id)
    .single();

  return {
    user: {
      name: profile?.full_name || user.user_metadata?.full_name || "Professor",
      email: user.email,
      avatarUrl: profile?.avatar_url || null,
    } as UserData,
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
  const supabase = await createClient();

  const { error } = await supabase.auth.updateUser({ password });

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
    console.error("Erro ao vincular imagem:", updateError);
    throw new Error("Falha ao atualizar a foto no perfil");
  }

  revalidatePath("/perfil");
  revalidatePath("/perfil/editar");
}
