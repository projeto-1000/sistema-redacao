"use server";

import { createClient } from "@/lib/server";
import { sendTeacherInvitationEmail } from "@repo/email";
import { onlyDigits } from "@repo/utils";
import { teacherInviteSchema, type TeacherInviteInput } from "@repo/validators";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

function getTeachersAppOrigin() {
  const configured = process.env.TEACHERS_APP_URL;
  if (!configured) return null;
  try {
    const url = new URL(configured);
    if (url.protocol !== "https:" && !(url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname))) return null;
    if (url.username || url.password || url.search || url.hash || url.pathname !== "/") return null;
    return url.origin;
  } catch {
    return null;
  }
}

export async function createTeacherInvitation(input: TeacherInviteInput): Promise<{ success: boolean; error?: string }> {
  const parsed = teacherInviteSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return { success: false, error: "Sessão administrativa inválida." };
  const { data: role, error: roleError } = await supabase.rpc("get_my_role");
  if (roleError || role !== "ADMIN") return { success: false, error: "Apenas administradores podem cadastrar professores." };

  const teachersOrigin = getTeachersAppOrigin();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SECRET_KEY;
  if (!teachersOrigin || !supabaseUrl || !serviceKey || !process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) {
    return { success: false, error: "O envio de convites ainda não está configurado. Nenhum cadastro foi criado." };
  }

  const admin = createSupabaseClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { fullName, email } = parsed.data;
  const document = onlyDigits(parsed.data.document);
  const phone = onlyDigits(parsed.data.phone);

  const { data: documentOwner, error: documentError } = await admin.from("profiles").select("id").eq("document", document).maybeSingle();
  if (documentError) return { success: false, error: "Não foi possível verificar o CPF. Tente novamente." };
  const { data: emailOwner, error: emailError } = await admin.from("profiles").select("id, role, document, full_name").eq("email", email).maybeSingle();
  if (emailError) return { success: false, error: "Não foi possível verificar o e-mail. Tente novamente." };
  if (documentOwner && documentOwner.id !== emailOwner?.id) return { success: false, error: "Este CPF já está cadastrado." };

  let teacherId = emailOwner?.id;
  let invitationName = fullName;
  if (emailOwner) {
    if ((emailOwner.role !== "TEACHER" && emailOwner.role !== "STUDENT") || emailOwner.document !== document) {
      return { success: false, error: "Este e-mail já está cadastrado." };
    }
    const { data: existing, error: existingError } = await admin.auth.admin.getUserById(emailOwner.id);
    if (existingError || existing.user?.app_metadata?.app_role !== "TEACHER" || existing.user?.user_metadata?.teacher_invitation_pending !== true) {
      return { success: false, error: "Este professor já concluiu o cadastro ou não pode receber um novo convite." };
    }
    invitationName = emailOwner.full_name || fullName;
  } else {
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      email_confirm: true,
      app_metadata: { app_role: "TEACHER" },
      user_metadata: {
        full_name: fullName,
        document,
        phone_country_code: "55",
        phone,
        teacher_invitation_pending: true,
      },
    });
    if (createError || !created.user) {
      return { success: false, error: "Não foi possível cadastrar o professor. Confira se e-mail ou CPF já estão em uso." };
    }
    teacherId = created.user.id;
  }

  if (!teacherId) return { success: false, error: "Não foi possível identificar o professor. Nenhum convite foi enviado." };

  if (emailOwner?.role !== "TEACHER") {
    const { error: finalizeError } = await admin.rpc("finalize_teacher_invitation_profile", { p_user_id: teacherId });
    if (finalizeError) {
      // Leave the pending account intact for a safe retry. The SQL function is
      // transactional and refuses to touch accounts with student activity.
      revalidatePath("/professores");
      return { success: false, error: "O cadastro ficou pendente e nenhum convite foi enviado. Corrija a configuração e tente novamente com os mesmos dados." };
    }
  }

  const { data: verifiedProfile, error: verifyError } = await admin.from("profiles").select("role").eq("id", teacherId).single();
  if (verifyError || verifiedProfile?.role !== "TEACHER") {
    return { success: false, error: "Não foi possível confirmar o perfil do professor. Nenhum convite foi enviado." };
  }

  const studentArtifacts = await Promise.all([
    admin.from("subscriptions").select("id", { count: "exact", head: true }).eq("user_id", teacherId),
    admin.from("credit_transactions").select("id", { count: "exact", head: true }).eq("user_id", teacherId),
    admin.from("free_credit_allocations").select("id", { count: "exact", head: true }).eq("user_id", teacherId),
    admin.from("student_credits").select("user_id", { count: "exact", head: true }).eq("user_id", teacherId),
  ]);
  if (studentArtifacts.some(({ count, error }) => error || count !== 0)) {
    return { success: false, error: "O cadastro ainda possui dados de aluno. Nenhum convite foi enviado." };
  }

  const { data: link, error: linkError } = await admin.auth.admin.generateLink({ type: "recovery", email });
  const tokenHash = link?.properties?.hashed_token;
  if (linkError || !tokenHash) {
    revalidatePath("/professores");
    return { success: false, error: "Professor cadastrado, mas o convite não foi enviado. Envie novamente pelo mesmo formulário." };
  }

  const signupUrl = new URL("/auth/confirm", teachersOrigin);
  signupUrl.searchParams.set("token_hash", tokenHash);

  try {
    await sendTeacherInvitationEmail({ to: email, teacherName: invitationName, signupUrl: signupUrl.toString() });
  } catch {
    revalidatePath("/professores");
    return { success: false, error: "Professor cadastrado, mas não foi possível confirmar o envio do convite. Tente novamente com os mesmos dados." };
  }

  revalidatePath("/professores");
  return { success: true };
}
