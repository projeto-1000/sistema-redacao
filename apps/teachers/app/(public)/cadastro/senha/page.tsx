import { completeTeacherInvitation } from "@/app/actions/complete-invitation";
import { createClient } from "@/lib/server";
import { AuthFormCard } from "@repo/ui/components/auth-form-card";
import { PasswordSetupForm } from "@repo/ui/components/features/auth/password-setup-form";
import { Logo } from "@repo/ui/components/logo";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Concluir cadastro - Projeto 1000" };

export default async function TeacherPasswordSetupPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const validInvitation = user?.user_metadata?.teacher_invitation_pending === true;

  return (
    <main className="auth-page-background flex min-h-dvh items-center justify-center px-4 py-10 sm:px-6">
      <div className="relative z-10 flex w-full max-w-[520px] flex-col items-center">
        <Logo className="mb-8 h-20 sm:h-24" />
        {validInvitation ? (
          <PasswordSetupForm loginHref="/login" onSubmitAction={completeTeacherInvitation} />
        ) : (
          <AuthFormCard
            title="Link inválido ou já utilizado"
            description="Peça ao administrador um novo convite caso ainda não tenha definido sua senha."
            footer={
              <Link href="/login" className="text-primary font-semibold hover:underline">
                Ir para o login
              </Link>
            }
          />
        )}
      </div>
    </main>
  );
}
