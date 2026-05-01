"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircleIcon, Eye, EyeOff } from "lucide-react";
import Link from "next/link"; // 💡 Importação do Link do Next.js
import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "./form";
import { Input } from "./input";
import { Button } from "./button";
import { loginSchema, type LoginSchema } from "@repo/validators";
import { Logo } from "./logo";
import { Alert, AlertDescription, AlertTitle } from "./alert";
import { getErrorContent } from "@repo/utils";

type AppType = "admin" | "teacher" | "student";

const APP_CONFIG: Record<AppType, { title: string; description: string; }> = {
  student: {
    title: "Melhore suas notas hoje!",
    description: 'Entre na sua conta para continuar seus estudos.',
  },
  teacher: {
    title: "Área do Professor",
    description: 'Acesse para gerenciar suas correções',
  },
  admin: {
    title: "Painel Administrativo",
    description: 'Acesso restrito para administradores',
  },
};

interface LoginFormProps {
  appType: AppType;
  onSubmit: (values: LoginSchema) => Promise<void>;
  isSubmitting?: boolean;
  error: string | null;
}

export function LoginForm({ appType, onSubmit, isSubmitting = false, error }: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);

  const text = APP_CONFIG[appType];
  const errorContent = getErrorContent(error);

  const form = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
    mode: "onBlur",
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const { isValid } = form.formState;

  const handleSubmit = async (values: LoginSchema) => {
    await onSubmit(values);
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
            {text.title}
          </CardTitle>
          <CardDescription className="text-slate-500 text-sm sm:text-base md:text-[16px]">
            {text.description}
          </CardDescription>
        </CardHeader>

        <CardContent className="p-0">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">
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

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-700 uppercase tracking-wider text-[13px]">Senha</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          className={`w-full rounded-2xl h-12 p-3.5 ${inputFocusClass}`}
                          type={showPassword ? "text" : "password"}
                          placeholder="******"
                          {...field}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full px-3 py-2"
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
                    <FormMessage />

                    <Link href="/forgot-password" className="block mt-2 text-right text-sm text-slate-500 hover:underline">
                      Esqueceu sua senha?
                    </Link>
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                variant={appType !== 'admin' ? 'default' : 'secondary'}
                className="w-full font-bold h-12 rounded-2xl text-[16px]"
                disabled={isSubmitting || !isValid}
                isLoading={isSubmitting}
                loadingText="Entrando..."
              >
                Entrar
              </Button>
            </form>
          </Form>

          {errorContent && (
            <Alert variant="destructive" className="mt-6 text-left">
              <AlertCircleIcon className="h-4 w-4" />
              <AlertTitle>{errorContent.title}</AlertTitle>
              <AlertDescription>
                {errorContent.description}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>

        {appType !== 'admin' && (
          <CardFooter className="flex flex-col justify-center p-0 mt-6">
            <div className="w-full pt-4 border-t border-[#e8e4ce] text-center">
              <p>
                Ainda não tem uma conta?
                <Link className="text-primary font-medium hover:underline ml-1" href="/signup">
                  Cadastre-se
                </Link>
              </p>
            </div>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
