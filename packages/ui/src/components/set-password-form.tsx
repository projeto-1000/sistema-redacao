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
                <FormLabel className="text-slate-700 uppercase tracking-wider text-[13px]">
                  Senha
                </FormLabel>
                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-400" />
                  <FormControl>
                    <Input
                      className="h-12 w-full rounded-2xl py-3.5 pl-12 pr-12 focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary"
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
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    aria-label={
                      showPassword ? "Ocultar senha" : "Mostrar senha"
                    }
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
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
                <FormLabel className="text-slate-700 uppercase tracking-wider text-[13px]">
                  Confirmar Senha
                </FormLabel>
                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-400" />
                  <FormControl>
                    <Input
                      className="h-12 w-full rounded-2xl py-3.5 pl-12 pr-12 focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary"
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
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    aria-label={
                      showConfirmPassword
                        ? "Ocultar confirmação de senha"
                        : "Mostrar confirmação de senha"
                    }
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
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
                <FormItem className="flex flex-row items-start my-6">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className="mt-0.5 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                  </FormControl>
                  <div className="space-y-2 leading-none">
                    <FormLabel className="text-slate-600 font-medium leading-relaxed">
                      Eu concordo com os Termos de Uso e Políticas de
                      Privacidade da plataforma.
                    </FormLabel>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />
          )}

          <Button
            type="submit"
            className="w-full font-medium h-12 rounded-2xl text-[16px]"
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
