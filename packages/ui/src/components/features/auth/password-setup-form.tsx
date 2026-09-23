"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AuthFormCard } from "@repo/ui/components/auth-form-card";
import { Button } from "@repo/ui/components/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@repo/ui/components/form";
import { Input } from "@repo/ui/components/input";
import {
  passwordSetupSchema,
  type PasswordSetupSchema,
} from "@repo/validators";
import { LockKeyhole } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

type PasswordSetupResult =
  | { success: true; redirectTo: string }
  | { success: false; error: string };

interface PasswordSetupFormProps {
  onSubmitAction: (values: PasswordSetupSchema) => Promise<PasswordSetupResult>;
  loginHref: string;
}

export function PasswordSetupForm({
  onSubmitAction,
  loginHref,
}: PasswordSetupFormProps) {
  const router = useRouter();
  const form = useForm<PasswordSetupSchema>({
    resolver: zodResolver(passwordSetupSchema),
    mode: "onChange",
    defaultValues: { password: "", confirmPassword: "" },
  });

  const handleSubmit = async (values: PasswordSetupSchema) => {
    form.clearErrors("root");

    try {
      const result = await onSubmitAction(values);

      if (!result.success) {
        form.setError("root", { message: result.error });
        return;
      }

      router.replace(result.redirectTo);
      router.refresh();
    } catch {
      form.setError("root", {
        message: "Não foi possível concluir o cadastro. Tente novamente.",
      });
    }
  };

  return (
    <AuthFormCard
      title="Defina sua senha"
      description="Crie uma senha para concluir seu cadastro no Projeto 1000."
      footer={
        <p>
          Já possui uma conta?&nbsp;
          <Link
            href={loginHref}
            className="font-semibold text-primary hover:underline"
          >
            Entrar
          </Link>
        </p>
      }
    >
      <Form {...form}>
        <form className="space-y-5" onSubmit={form.handleSubmit(handleSubmit)}>
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[13px] tracking-wider text-slate-700 uppercase">
                  Senha
                </FormLabel>
                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-400" />
                  <FormControl>
                    <Input
                      type="password"
                      autoComplete="new-password"
                      className="focus-visible:border-primary focus-visible:ring-primary h-12 w-full rounded-2xl py-3.5 pr-4 pl-12 focus-visible:ring-1"
                      placeholder="Mínimo de 6 caracteres"
                      {...field}
                    />
                  </FormControl>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[13px] tracking-wider text-slate-700 uppercase">
                  Confirmar senha
                </FormLabel>
                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-400" />
                  <FormControl>
                    <Input
                      type="password"
                      autoComplete="new-password"
                      className="focus-visible:border-primary focus-visible:ring-primary h-12 w-full rounded-2xl py-3.5 pr-4 pl-12 focus-visible:ring-1"
                      placeholder="Digite a senha novamente"
                      {...field}
                    />
                  </FormControl>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          {form.formState.errors.root?.message && (
            <p role="alert" className="text-destructive text-sm">
              {form.formState.errors.root.message}
            </p>
          )}

          <Button
            type="submit"
            className="h-12 w-full rounded-2xl"
            disabled={!form.formState.isValid}
            isLoading={form.formState.isSubmitting}
            loadingText="Concluindo cadastro..."
          >
            Concluir cadastro
          </Button>
        </form>
      </Form>
    </AuthFormCard>
  );
}
