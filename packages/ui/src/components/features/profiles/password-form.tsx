"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Lock } from "lucide-react";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@repo/ui/components/form";
import { toast } from "sonner";
import { ActionResponse } from "./profile-view";
import { updatePasswordSchema, type UpdatePasswordSchema } from "@repo/validators";
import { PasswordRequirements } from "@repo/ui/components/password-requirements";

interface PasswordFormProps {
  onUpdate: (password: string) => Promise<ActionResponse>;
}

export function PasswordForm({ onUpdate }: PasswordFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm<UpdatePasswordSchema>({
    resolver: zodResolver(updatePasswordSchema),
    mode: "onChange",
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const { isValid, isDirty, isSubmitting } = form.formState;
  const password = useWatch({ control: form.control, name: "password" });

  const onSubmit = async (data: UpdatePasswordSchema) => {
    try {
      const response = await onUpdate(data.password);

      if (!response.success) {
        toast.error("Erro ao atualizar senha", {
          description: response.error,
        });
        return;
      }

      toast.success("Senha atualizada com sucesso!");

      form.reset();
      setShowPassword(false);
      setShowConfirmPassword(false);
    } catch {
      toast.error("Erro de conexão ao tentar atualizar a senha.");
    }
  };

  return (
    <div className="animate-in fade-in mx-auto max-w-md space-y-6 p-8 py-12 duration-500 md:p-12">
      <div className="space-y-2 text-center">
        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-slate-50">
          <Lock className="size-8 text-slate-400" />
        </div>
        <h3 className="text-xl font-bold">Alterar sua senha</h3>
        <p className="text-sm text-slate-500">Escolha uma senha forte para proteger sua conta.</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-bold text-slate-700">Nova Senha</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Digite sua nova senha"
                      {...field}
                      className="focus:ring-primary h-12 w-full rounded-2xl border-[#e8e4ce] p-3.5 pr-12 focus:ring-1"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute top-0 right-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="text-muted-foreground h-4 w-4" />
                      ) : (
                        <Eye className="text-muted-foreground h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </FormControl>
                <FormMessage className="text-xs font-semibold" />
              </FormItem>
            )}
          />

          <PasswordRequirements password={password} />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-bold text-slate-700">
                  Confirmar Nova Senha
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirme sua nova senha"
                      {...field}
                      className="focus:ring-primary h-12 w-full rounded-2xl border-[#e8e4ce] p-3.5 pr-12 focus:ring-1"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute top-0 right-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="text-muted-foreground h-4 w-4" />
                      ) : (
                        <Eye className="text-muted-foreground h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </FormControl>
                <FormMessage className="text-xs font-semibold" />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            disabled={isSubmitting || !isDirty || !isValid}
            className="mt-2 h-12 w-full rounded-xl font-bold shadow-lg shadow-yellow-500/20"
            isLoading={isSubmitting}
            loadingText="Salvando..."
          >
            Atualizar senha
          </Button>
        </form>
      </Form>
    </div>
  );
}
