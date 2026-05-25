'use client'

import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { ShieldCheck } from "lucide-react";
import { Suspense } from "react";
import { SetPasswordForm } from '@repo/ui/components/set-password-form'
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
        duration: 5000
      });

      router.push("/inicio");
    } catch (error: any) {
      const { title, description } = getErrorMessage(error);
      toast.error(title, { description: description, duration: 5000 });
    }
  };

  return (
    <SetPasswordForm
      title={isReset ? "Redefinir Senha" : "Defina sua senha"}
      description={isReset ? "Crie uma nova senha de acesso à área do aluno." : "Crie uma senha segura para acessar a área de aluno."}
      buttonText={isReset ? "Atualizar Senha" : "Salvar e Acessar Plataforma"}
      showTerms={!isReset}
      onSubmitAction={handlePasswordSubmit}
    />
  );
}

export default function NewPasswordPage() {
  return (
    <div className="bg-gradient-soft min-h-dvh flex items-center flex-col justify-center p-4">
      <Suspense fallback={<div className="h-[500px] w-full max-w-[500px] animate-pulse bg-white/50 rounded-xl" />}>
        <NewPasswordContent />
      </Suspense>

      <footer className="mt-8 text-center text-[12px] text-slate-500 flex items-center gap-2 font-bold uppercase tracking-wider">
        <ShieldCheck className="text-emerald-500 size-4" />
        Ambiente seguro e criptografado.
      </footer>
    </div>
  )
}