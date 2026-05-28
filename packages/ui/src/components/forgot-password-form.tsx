'use client'

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ForgotPasswordSchema, forgotPasswordSchema } from "@repo/validators";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "./form";
import { Input } from "./input";
import { Button } from "./button";
import { Logo } from "./logo";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./card";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type AppType = "admin" | "teacher" | "student";

interface ForgotPasswordFormProps {
  appType: AppType;
  onSubmitAction: (data: ForgotPasswordSchema) => Promise<{ success: boolean; error?: string }>;
  backToLoginHref: string;
}

export function ForgotPasswordForm({ appType, onSubmitAction, backToLoginHref }: ForgotPasswordFormProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const router = useRouter();

  const form = useForm<ForgotPasswordSchema>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const { isSubmitting, isValid } = form.formState;

  const onSubmit = async (data: ForgotPasswordSchema) => {
    setServerError(null);
    const result = await onSubmitAction(data);

    if (result.success) {
      toast.success("E-mail enviado com sucesso!", {
        description: "Verifique sua caixa de entrada. Enviamos um link para você redefinir sua senha."
      })

      setTimeout(() => {
        router.push("/login");
      }, 3000);

    } else {
      setServerError(result.error || "Ocorreu um erro ao processar sua solicitação.");
    }
  };

  const inputFocusClass = appType === 'admin'
    ? 'focus-visible:ring-secondary focus-visible:border-secondary focus-visible:ring-1'
    : 'focus-visible:ring-primary focus-visible:border-primary focus-visible:ring-1';


  return (
    <div className="w-full max-w-[500px] flex flex-col items-center">
      <Logo className="h-20 md:h-22 mb-8" />

      <Card className="w-full bg-white rounded-xl shadow-xl border border-slate-100 px-5 py-6 md:py-8 md:px-6">
        <CardHeader className="text-center gap-2">
          <CardTitle className="text-2xl font-bold leading-tight">
            Esqueceu sua senha?
          </CardTitle>
          <CardDescription className="text-slate-500 text-sm sm:text-base md:text-[16px]">
            Digite seu e-mail para receber o link de recuperação.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-700 uppercase tracking-wider text-[13px]">E-mail</FormLabel>
                    <FormControl>
                      <Input
                        className={`w-full rounded-2xl h-12 p-3.5 ${inputFocusClass}`}
                        placeholder="seu@email.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />


              {serverError && (
                <p className="text-xs font-medium text-red-500 text-center">{serverError}</p>
              )}

              <Button
                type="submit"
                disabled={isSubmitting || !isValid}
                variant={appType !== 'admin' ? 'default' : 'secondary'}
                className="w-full font-bold h-12 rounded-xl text-[16px]"
                isLoading={isSubmitting}
                loadingText="Enviando..."
              >
                Enviar link de recuperação
              </Button>
            </form>
          </Form>

        </CardContent>
        <CardFooter className="h-fit flex items-center justify-center pt-4! border-t border-[#e8e4ce">
          <a href={backToLoginHref} className="text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors">
            Voltar para o login
          </a>
        </CardFooter>
      </Card>
    </div>
  );
}