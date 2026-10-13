"use client";

import { setNewPassword } from "@/app/actions/profile";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@repo/ui/components/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@repo/ui/components/card";
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
import { Logo } from "@repo/ui/components/logo";
import { getErrorMessage } from "@repo/utils";
import { type SetPasswordSchema, setPasswordSchema } from "@repo/validators";
import { EyeOff, Eye } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

export function SetPasswordForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm({
    resolver: zodResolver(setPasswordSchema),
    mode: "onChange",
    defaultValues: {
      password: "",
      confirmPassword: "",
      terms: false,
    },
  });

  const { isValid, isSubmitting } = form.formState;

  const handleSubmit = async (values: SetPasswordSchema) => {
    try {
      await setNewPassword(values);

      router.push("/inicio");
    } catch (error: unknown) {
      const { title, description } = getErrorMessage(error);

      toast.error(title, {
        description: description,
        duration: 5000,
      });
    }
  };

  return (
    <div className="flex w-full max-w-[500px] flex-col items-center">
      <Logo className="mt-4 mb-8 h-20 md:h-24" />

      <Card className="w-full max-w-[500px] rounded-xl border border-slate-100 bg-white px-5 py-6 shadow-xl md:px-6 md:py-8">
        <CardHeader className="gap-2 text-center">
          <CardTitle className="text-2xl leading-tight font-bold">Defina sua senha</CardTitle>
          <CardDescription className="text-sm text-slate-500 sm:text-base md:text-[16px]">
            Crie uma senha segura para acessar a área de aluno.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-0">
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
                    <FormControl>
                      <div className="relative">
                        <Input
                          className="focus-visible:ring-primary focus-visible:border-primary h-12 w-full rounded-2xl p-3.5 focus-visible:ring-1"
                          type={showPassword ? "text" : "password"}
                          placeholder="Crie uma senha segura"
                          {...field}
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
                      Confirmar Senha
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          className="focus-visible:ring-primary focus-visible:border-primary h-12 w-full rounded-2xl p-3.5 focus-visible:ring-1"
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Confirme sua senha"
                          {...field}
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
                    <FormMessage />
                  </FormItem>
                )}
              />

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
              <Button
                type="submit"
                className="h-12 w-full rounded-2xl text-[16px] font-medium"
                disabled={isSubmitting || !isValid}
                isLoading={isSubmitting}
                loadingText="Salvando..."
              >
                Salvar e Acessar Plataforma
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
