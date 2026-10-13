"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ForgotPasswordSchema, forgotPasswordSchema } from "@repo/validators";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "./form";
import { Input } from "./input";
import { Button } from "./button";
import { toast } from "sonner";
import { Mail } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthFormCard } from "./auth-form-card";

interface ForgotPasswordFormProps {
  onSubmitAction: (data: ForgotPasswordSchema) => Promise<{
    success: boolean;
    error?: string;
  }>;
  backToLoginHref: string;
}

export function ForgotPasswordForm({ onSubmitAction, backToLoginHref }: ForgotPasswordFormProps) {
  const [serverError, setServerError] = useState<string | null>(null);

  const [isRedirecting, setIsRedirecting] = useState(false);

  const router = useRouter();

  const form = useForm<ForgotPasswordSchema>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      email: "",
    },
  });

  const { isSubmitting, isValid } = form.formState;

  const isLoading = isSubmitting || isRedirecting;

  const onSubmit = async (data: ForgotPasswordSchema) => {
    setServerError(null);

    const result = await onSubmitAction(data);

    if (result.success) {
      setIsRedirecting(true);

      toast.success("E-mail enviado com sucesso!", {
        description:
          "Verifique sua caixa de entrada. Enviamos um link para você redefinir sua senha.",
      });

      setTimeout(() => {
        router.replace("/login");
      }, 3000);

      return;
    }

    setServerError(result.error || "Ocorreu um erro ao processar sua solicitação.");
  };

  return (
    <AuthFormCard
      title="Esqueceu sua senha?"
      description="Digite seu e-mail para receber o link de recuperação."
      footer={
        <Link
          href={backToLoginHref}
          className="text-primary font-semibold transition-colors hover:underline"
        >
          Voltar para o login
        </Link>
      }
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[13px] tracking-wider text-slate-700 uppercase">
                  E-mail
                </FormLabel>

                <div className="relative">
                  <Mail className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-slate-400" />
                  <FormControl>
                    <Input
                      className="focus-visible:border-primary focus-visible:ring-primary h-12 w-full rounded-2xl py-3.5 pr-4 pl-12 focus-visible:ring-1"
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      placeholder="seu@email.com"
                      {...field}
                    />
                  </FormControl>
                </div>

                <FormMessage />
              </FormItem>
            )}
          />

          {serverError && (
            <p className="text-center text-xs font-medium text-red-500">{serverError}</p>
          )}

          <Button
            type="submit"
            disabled={isLoading || !isValid}
            className="h-12 w-full rounded-xl text-[16px] font-bold"
            isLoading={isLoading}
            loadingText={isRedirecting ? "Redirecionando..." : "Enviando..."}
          >
            Enviar link de recuperação
          </Button>
        </form>
      </Form>
    </AuthFormCard>
  );
}
