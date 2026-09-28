"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { ShieldCheck } from "lucide-react";
import { Suspense } from "react";
import { SetPasswordForm } from "@repo/ui/components/set-password-form";
import { Logo } from "@repo/ui/components/logo";
import { type SetPasswordSchema } from "@repo/validators";
import { getErrorMessage } from "@repo/utils";
import { setNewPassword, updatePassword } from "@/app/actions/profile";

function NewPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const flow = searchParams.get("flow");
  const isReset = flow === "reset";

  const handlePasswordSubmit = async (values: SetPasswordSchema) => {
    try {
      if (isReset) {
        const result = await updatePassword(values.password);
        if (!result.success) throw new Error(result.error);
      } else {
        const result = await setNewPassword(values);
        if (result.error) throw new Error(result.error);
      }

      toast.success(isReset ? "Senha atualizada!" : "Bem-vindo(a)!", {
        description: isReset ? "Sua senha foi redefinida." : "Acesso liberado com sucesso.",
        duration: 5000,
      });

      router.push("/inicio");
    } catch (error: unknown) {
      const { title, description } = getErrorMessage(error);
      toast.error(title, { description: description, duration: 5000 });
    }
  };

  return (
    <>
      <title>Criar Nova Senha - Projeto 1000 </title>

      <SetPasswordForm
        title={isReset ? "Redefinir Senha" : "Defina sua senha"}
        description={
          isReset
            ? "Crie uma nova senha de acesso à área do aluno."
            : "Crie uma senha segura para acessar a área de aluno."
        }
        buttonText={isReset ? "Atualizar Senha" : "Salvar e Acessar Plataforma"}
        showTerms={!isReset}
        onSubmitAction={handlePasswordSubmit}
      />
    </>
  );
}

export default function NewPasswordPage() {
  return (
    <main className="auth-page-background flex min-h-dvh items-center justify-center px-4 py-10 sm:px-6">
      <div className="relative z-10 flex w-full max-w-[520px] flex-col items-center">
        <Logo className="mb-8 h-20 sm:h-24" />
        <Suspense
          fallback={<div className="h-[500px] w-full animate-pulse rounded-[28px] bg-white/60" />}
        >
          <NewPasswordContent />
        </Suspense>

        <footer className="mt-8 flex items-center gap-2 text-center text-[12px] font-bold tracking-wider text-slate-500 uppercase">
          <ShieldCheck className="size-4 text-emerald-500" />
          Ambiente seguro e criptografado.
        </footer>
      </div>
    </main>
  );
}
