"use server";

import { createClient } from "@/lib/server";
import { revalidatePath } from "next/cache";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

async function getAdminUser(supabase: SupabaseClient) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) return null;

  const { data: role, error: roleError } = await supabase.rpc("get_my_role");

  if (roleError || role !== "ADMIN") return null;

  return user;
}

export async function getProfileData() {
  const supabase = await createClient();
  const user = await getAdminUser(supabase);

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, role, onboarding_completed")
    .eq("id", user.id)
    .single();

  return {
    user: {
      id: profile?.id ?? user.id,
      name: profile?.full_name || user.user_metadata?.full_name || "Administrador",
      email: user.email ?? "",
      credits: 0,
      avatarUrl: profile?.avatar_url || null,
      role: profile?.role ?? "ADMIN",
      onboarding_completed: profile?.onboarding_completed ?? true,
    },
  };
}

export async function updateProfile({ name }: { name: string }) {
  const supabase = await createClient();
  const user = await getAdminUser(supabase);

  if (!user) {
    return { success: false, error: "Sessão administrativa inválida." };
  }

  const normalizedName = name.trim();

  if (!normalizedName) {
    return { success: false, error: "Informe o nome completo." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ full_name: normalizedName })
    .eq("id", user.id);

  if (error) {
    console.error("[ADMIN_PROFILE_UPDATE_ERROR]", error);
    return { success: false, error: "Não foi possível atualizar o perfil." };
  }

  revalidatePath("/perfil");
  revalidatePath("/perfil/editar");

  return { success: true };
}

export async function updatePassword(password: string) {
  const supabase = await createClient();
  const user = await getAdminUser(supabase);

  if (!user) {
    return { success: false, error: "Sessão administrativa inválida." };
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    console.error("[ADMIN_PASSWORD_UPDATE_ERROR]", error);

    return {
      success: false,
      error: "Não foi possível atualizar a senha",
    };
  }

  return { success: true };
}

export async function uploadAvatar(formData: FormData) {
  const supabase = await createClient();
  const user = await getAdminUser(supabase);

  if (!user) {
    return { success: false, error: "Sessão administrativa inválida." };
  }

  const file = formData.get("file");

  if (!(file instanceof File)) {
    return { success: false, error: "Nenhum arquivo enviado." };
  }

  const fileExt = file.name.split(".").pop() || "jpg";
  const fileName = `${user.id}/${Date.now()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage.from("avatars").upload(fileName, file, {
    upsert: true,
    contentType: file.type,
  });

  if (uploadError) {
    console.error("[ADMIN_AVATAR_UPLOAD_ERROR]", uploadError);
    return { success: false, error: "Falha ao salvar a imagem." };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("avatars").getPublicUrl(fileName);

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ avatar_url: publicUrl })
    .eq("id", user.id);

  if (updateError) {
    console.error("[ADMIN_AVATAR_PROFILE_UPDATE_ERROR]", updateError);
    return { success: false, error: "Falha ao atualizar a foto no perfil." };
  }

  revalidatePath("/perfil");
  revalidatePath("/perfil/editar");

  return { success: true, avatarUrl: publicUrl };
}
