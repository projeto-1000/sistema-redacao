"use server";

import { createClient } from "@/lib/server";
import { revalidatePath } from "next/cache";

export async function updateProfile(data: { name?: string; avatarFile?: File | null }) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Não autorizado");

  const updates: Record<string, any> = {};

  if (data.name) {
    updates.full_name = data.name;
  }

  if (data.avatarFile && data.avatarFile.size > 0) {
    const fileExt = data.avatarFile.name.split(".").pop();
    const filePath = `${user.id}-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, data.avatarFile, { upsert: true, contentType: data.avatarFile.type });

    if (uploadError) {
      throw new Error("Erro no upload da imagem");
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("avatars").getPublicUrl(filePath);

    updates.avatar_url = publicUrl;
  }

  if (Object.keys(updates).length > 0) {
    const { error } = await supabase.from("profiles").update(updates).eq("id", user.id);

    if (error) throw error;

    revalidatePath("/perfil");
    return { success: true };
  }

  return { success: false, message: "Nada para atualizar" };
}
