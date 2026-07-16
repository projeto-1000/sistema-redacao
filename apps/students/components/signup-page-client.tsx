"use client";

import { completeHotmartMentorshipSignup } from "@/app/actions/hotmart-mentorship";
import { useAuth } from "@/hooks/use-auth";
import type { SignupContext } from "@/types";
import { SignUpForm } from "@repo/ui/components/signup-form";
import type { RegisterSchema } from "@repo/validators";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface SignupPageClientProps {
  context: SignupContext;
}

export function SignupPageClient({ context }: SignupPageClientProps) {
  const router = useRouter();
  const { register } = useAuth();

  const isHotmartMentorship = context.source === "HOTMART_MENTORIA";

  const handleRegister = async (values: RegisterSchema) => {
    if (context.source === "ORGANIC") {
      await register(values);
      return;
    }

    await completeHotmartMentorshipSignup({
      token: context.token,
      values,
    });

    toast.success("Cadastro finalizado!", {
      description: "Seu acesso ao Plano Mentoria foi liberado.",
      duration: 5000,
    });

    router.replace("/inicio");
    router.refresh();
  };

  return (
    <SignUpForm
      appType="student"
      title={isHotmartMentorship ? "Finalize seu cadastro" : undefined}
      description={
        isHotmartMentorship
          ? "Confirme seus dados para liberar seu acesso ao Projeto 1000."
          : undefined
      }
      submitLabel={
        isHotmartMentorship ? "Finalizar cadastro" : "Cadastrar"
      }
      loadingText={
        isHotmartMentorship
          ? "Finalizando cadastro..."
          : "Criando conta..."
      }
      initialValues={
        isHotmartMentorship ? context.initialValues : undefined
      }
      lockedFields={
        isHotmartMentorship
          ? {
            email: true,
          }
          : undefined
      }
      onSubmit={handleRegister}
    />
  );
}