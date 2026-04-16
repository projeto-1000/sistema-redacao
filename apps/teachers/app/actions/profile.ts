import { UserData } from "@repo/types";
import { createClient } from "@/lib/server";

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
