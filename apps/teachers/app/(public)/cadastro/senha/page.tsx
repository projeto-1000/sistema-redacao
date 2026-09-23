import { completeTeacherInvitation } from "@/app/actions/complete-invitation";
import { createClient } from "@/lib/server";
import { PasswordSetupForm } from "@repo/ui/components/features/auth/password-setup-form";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Concluir cadastro - Projeto 1000" };

export default async function TeacherPasswordSetupPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const validInvitation = user?.user_metadata?.teacher_invitation_pending === true;

  return (
    <main className="bg-gradient-soft flex min-h-dvh items-center justify-center p-4">
      {validInvitation ? (
        <PasswordSetupForm loginHref="/login" onSubmitAction={completeTeacherInvitation} />
      ) : (
        <div className="w-full max-w-[500px] rounded-xl border border-slate-100 bg-white p-8 text-center shadow-xl">
          <h1 className="text-2xl font-bold text-slate-900">Link inválido ou já utilizado</h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-500">
            Peça ao administrador um novo convite caso ainda não tenha definido sua senha.
          </p>
          <Link href="/login" className="text-primary mt-6 inline-flex font-semibold hover:underline">Ir para o login</Link>
        </div>
      )}
    </main>
  );
}
