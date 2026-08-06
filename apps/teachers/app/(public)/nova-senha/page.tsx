"use client";

import { updatePassword } from "@/app/actions/profile";
import { SetPasswordForm } from "@repo/ui/components/set-password-form";
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
    <div className="bg-gradient-soft min-h-dvh flex items-center flex-col justify-center p-4">
      <title>Redefinir Senha - Projeto 1000</title>
      <SetPasswordForm
        title="Redefinir Senha"
        description="Crie uma nova senha de acesso à área do professor."
        buttonText="Atualizar Senha"
        showTerms={false}
        onSubmitAction={handlePasswordSubmit}
      />
      <footer className="mt-8 text-center text-[12px] text-slate-500 flex items-center gap-2 font-bold uppercase tracking-wider">
        <ShieldCheck className="text-emerald-500 size-4" />
        Ambiente seguro e criptografado.
      </footer>
    </div>
  );
}
