"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@repo/ui/components/button";
import { AuthFormCard } from "@repo/ui/components/auth-form-card";
import { Checkbox } from "@repo/ui/components/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@repo/ui/components/form";
import { Input } from "@repo/ui/components/input";
import { PasswordRequirements } from "@repo/ui/components/password-requirements";
import { type SetPasswordSchema, setPasswordSchema } from "@repo/validators";
import { EyeOff, Eye, LockKeyhole } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";

interface SetPasswordFormProps {
  title?: string;
  description?: string;
  buttonText?: string;
  showTerms?: boolean;
  onSubmitAction: (data: SetPasswordSchema) => Promise<void>;
}

export function SetPasswordForm({
  title = "Defina sua senha",
  description = "Crie uma senha segura para acessar a área de aluno.",
  buttonText = "Salvar e Acessar Plataforma",
  showTerms = true,
  onSubmitAction,
}: SetPasswordFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm<SetPasswordSchema>({
    resolver: zodResolver(setPasswordSchema),
    mode: "onChange",
    defaultValues: {
      password: "",
      confirmPassword: "",
      terms: !showTerms,
    },
  });

  const { isValid, isSubmitting } = form.formState;
  const password = form.watch("password");

  const handleSubmit = async (values: SetPasswordSchema) => {
    await onSubmitAction(values);
  };

  return (
    <AuthFormCard title={title} description={description}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[13px] tracking-wider text-slate-700 uppercase">
                  Senha
                </FormLabel>
                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-slate-400" />
                  <FormControl>
                    <Input
                      className="focus-visible:border-primary focus-visible:ring-primary h-12 w-full rounded-2xl py-3.5 pr-12 pl-12 focus-visible:ring-1"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="Crie uma senha segura"
                      {...field}
                    />
                  </FormControl>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute top-0 right-0 h-full px-3 py-2 hover:bg-transparent"
                    aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="text-muted-foreground h-4 w-4" />
                    ) : (
                      <Eye className="text-muted-foreground h-4 w-4" />
                    )}
                  </Button>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <PasswordRequirements password={password} />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[13px] tracking-wider text-slate-700 uppercase">
                  Confirmar Senha
                </FormLabel>
                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-slate-400" />
                  <FormControl>
                    <Input
                      className="focus-visible:border-primary focus-visible:ring-primary h-12 w-full rounded-2xl py-3.5 pr-12 pl-12 focus-visible:ring-1"
                      type={showConfirmPassword ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="Confirme sua senha"
                      {...field}
                    />
                  </FormControl>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute top-0 right-0 h-full px-3 py-2 hover:bg-transparent"
                    aria-label={
                      showConfirmPassword
                        ? "Ocultar confirmação de senha"
                        : "Mostrar confirmação de senha"
                    }
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="text-muted-foreground h-4 w-4" />
                    ) : (
                      <Eye className="text-muted-foreground h-4 w-4" />
                    )}
                  </Button>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          {showTerms && (
            <FormField
              control={form.control}
              name="terms"
              render={({ field }) => (
                <FormItem className="my-6 flex flex-row items-start">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className="data-[state=checked]:bg-primary data-[state=checked]:border-primary mt-0.5"
                    />
                  </FormControl>
                  <div className="space-y-2 leading-none">
                    <FormLabel className="leading-relaxed font-medium text-slate-600">
                      Eu concordo com os Termos de Uso e Políticas de Privacidade da plataforma.
                    </FormLabel>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />
          )}

          <Button
            type="submit"
            className="h-12 w-full rounded-2xl text-[16px] font-medium"
            disabled={isSubmitting || !isValid}
            isLoading={isSubmitting}
            loadingText="Salvando..."
          >
            {buttonText}
          </Button>
        </form>
      </Form>
    </AuthFormCard>
  );
}
