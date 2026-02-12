import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "./form";
import { Input } from "./input";
import { Button } from "./button";
import { loginSchema, type LoginSchema } from "@repo/validators";
import { useState } from "react";

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
}

export function LoginForm({ appType, onSubmit, isSubmitting = false }: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);

  const texts = APP_CONFIG[appType];

  const form = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
    mode: "onChange",
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const { isValid } = form.formState;

  const handleSubmit = async (values: LoginSchema) => {
    await onSubmit(values);
  };

  return (
    <div className="w-full max-w-[480px] flex flex-col items-center">

      <div className="mb-8 flex flex-col items-center gap-3">
        <h1 className="text-3xl font-bold tracking-tight">
          Projeto 1000
        </h1>
      </div>

      <Card className="w-full bg-white rounded-xl shadow-xl border border-[#e8e4ce]/30 p-8 md:p-10">
        <CardHeader className="mb-8 text-center">
          <CardTitle className="text-2xl font-bold leading-tight mb-2">
            {texts.title}
          </CardTitle>
          <CardDescription className="text-[#9c8e49] text-sm">
            {texts.description}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-mail</FormLabel>
                    <FormControl>
                      <Input
                        className="w-full rounded-3xl border-[#e8e4ce] h-12 p-3.5 focus:ring-1 focus:ring-primary"
                        placeholder="seu@email.com"
                        {...field} />
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
                    <FormLabel>Senha</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          className="w-full rounded-3xl border-[#e8e4ce] h-12 p-3.5 focus:ring-1 focus:ring-primary"
                          type={showPassword ? "text" : "password"}
                          placeholder="******"
                          {...field}
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
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full font-bold h-12 rounded-3xl"
                disabled={isSubmitting || !isValid}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  "Entrar"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>

        <CardFooter className="flex flex-col justify-center">
          <a className="hover:underline text-sm" href="#">
            Esqueceu sua senha?
          </a>
          <div className=" w-full mt-4 pt-4 border-t border-[#e8e4ce] text-center text-sm">
            <p>
              Ainda não tem uma conta?
              <a className="text-primary font-bold hover:underline ml-1" href="/signup">Cadastre-se</a>
            </p>
          </div>
        </CardFooter>
      </Card >
    </div >
  );
}