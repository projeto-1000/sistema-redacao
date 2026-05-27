'use client'

import { useState } from "react";
import { useForm } from "react-hook-form";
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

interface PasswordFormProps {
  onUpdate: (password: string) => Promise<ActionResponse>;
}

export function PasswordForm({ onUpdate }: PasswordFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm<UpdatePasswordSchema>({
    resolver: zodResolver(updatePasswordSchema),
    mode: "onChange",
  });

  const { isValid, isDirty, isSubmitting } = form.formState;


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
    } catch (error) {
      console.log(error);
      toast.error("Erro de conexão ao tentar atualizar a senha.");
    }
  };

  return (
    <div className="p-8 md:p-12 max-w-md mx-auto space-y-6 py-12 animate-in fade-in duration-500">
      <div className="text-center space-y-2">
        <div className="size-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
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
                      placeholder="••••••••"
                      {...field}
                      className="w-full rounded-2xl h-12 p-3.5 pr-12 focus:ring-1 focus:ring-primary border-[#e8e4ce]"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </FormControl>
                <FormMessage className="text-xs font-semibold" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-bold text-slate-700">Confirmar Nova Senha</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="••••••••"
                      {...field}
                      className="w-full rounded-2xl h-12 p-3.5 pr-12 focus:ring-1 focus:ring-primary border-[#e8e4ce]"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
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
            className="w-full h-12 rounded-xl font-bold mt-2 shadow-lg shadow-yellow-500/20"
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