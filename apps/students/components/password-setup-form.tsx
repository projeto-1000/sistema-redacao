"use client";

import { completeOrganicSignup } from "@/app/actions/organic-signup";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@repo/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/card";
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
import { passwordSetupSchema, type PasswordSetupSchema } from "@repo/validators";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

interface PasswordSetupFormProps {
  token: string;
}

export function PasswordSetupForm({ token }: PasswordSetupFormProps) {
  const router = useRouter();
  const form = useForm<PasswordSetupSchema>({
    resolver: zodResolver(passwordSetupSchema),
    mode: "onChange",
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const handleSubmit = async (values: PasswordSetupSchema) => {
    form.clearErrors("root");

    const result = await completeOrganicSignup({ token, ...values });

    if (!result.success) {
      form.setError("root", { message: result.error });
      return;
    }

    router.replace(result.redirectTo);
    router.refresh();
  };

  return (
    <div className="flex w-full max-w-[500px] flex-col items-center">
      <Logo className="mb-8 h-20 md:h-22" />

      <Card className="w-full rounded-xl border border-slate-100 bg-white px-5 py-6 shadow-xl md:px-6 md:py-8">
        <CardHeader className="gap-2 text-center">
          <CardTitle className="text-2xl leading-tight font-bold">Defina sua senha</CardTitle>
          <CardDescription className="text-sm text-slate-500 sm:text-base md:text-[16px]">
            Crie uma senha para concluir seu cadastro no Projeto 1000.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-0">
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
                    <FormControl>
                      <Input
                        type="password"
                        autoComplete="new-password"
                        className="focus-visible:border-primary focus-visible:ring-primary h-12 w-full rounded-2xl p-3.5 focus-visible:ring-1"
                        placeholder="Mínimo de 6 caracteres"
                        {...field}
                      />
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
                      Confirmar senha
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        autoComplete="new-password"
                        className="focus-visible:border-primary focus-visible:ring-primary h-12 w-full rounded-2xl p-3.5 focus-visible:ring-1"
                        placeholder="Digite a senha novamente"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {form.formState.errors.root?.message ? (
                <p role="alert" className="text-destructive text-sm">
                  {form.formState.errors.root.message}
                </p>
              ) : null}

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
        </CardContent>

        <CardFooter className="justify-center px-0 pt-6 pb-0 text-sm text-slate-500">
          Já possui uma conta?&nbsp;
          <Link href="/login" className="text-primary font-semibold hover:underline">
            Entrar
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
