"use client";

import { updatePassword } from "@/app/actions/profile";
import { SetPasswordForm } from "@repo/ui/components/set-password-form";
import { Logo } from "@repo/ui/components/logo";
import { type SetPasswordSchema } from "@repo/validators";
import { getErrorMessage } from "@repo/utils";
import { ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function NewPasswordPage() {
  const router = useRouter();

  const handlePasswordSubmit = async (values: SetPasswordSchema) => {
    try {
      const result = await updatePassword(values.password);
      if (!result.success) throw new Error(result.error);

      toast.success("Senha atualizada!", {
        description: "Sua senha foi redefinida.",
        duration: 5000,
      });
      router.push("/inicio");
    } catch (error) {
      const { title, description } = getErrorMessage(error);
      toast.error(title, { description, duration: 5000 });
    }
  };

  return (
    <main className="auth-page-background flex min-h-dvh items-center justify-center px-4 py-10 sm:px-6">
      <title>Redefinir Senha - Projeto 1000</title>
      <div className="relative z-10 flex w-full max-w-[520px] flex-col items-center">
        <Logo className="mb-8 h-20 sm:h-24" />
        <SetPasswordForm
          title="Redefinir Senha"
          description="Crie uma nova senha de acesso à área administrativa."
          buttonText="Atualizar Senha"
          showTerms={false}
          onSubmitAction={handlePasswordSubmit}
        />
        <footer className="mt-8 flex items-center gap-2 text-center text-[12px] font-bold tracking-wider text-slate-500 uppercase">
          <ShieldCheck className="size-4 text-emerald-500" />
          Ambiente seguro e criptografado.
        </footer>
      </div>
    </main>
  );
}
