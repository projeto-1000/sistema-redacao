import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import { registerSchema, type RegisterSchema } from "@repo/validators";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./card";
import { Button } from "./button";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "./form";
import { Input } from "./input";
import { Logo } from "./logo";
import Link from "next/link";
import { formatCPF, formatPhone, getErrorMessage } from "@repo/utils";
import { Checkbox } from "./checkbox";
import { toast } from "sonner";

type AppType = "admin" | "teacher" | "student";

const ROLE_MAP: Record<AppType, "STUDENT" | "TEACHER" | "ADMIN"> = {
  student: "STUDENT",
  teacher: "TEACHER",
  admin: "ADMIN",
};

const APP_CONFIG: Record<AppType, { title: string; description: string; }> = {
  student: {
    title: "Crie sua conta",
    description: 'Junte-se aos nossos estudantes e melhore suas redações hoje mesmo.',
  },
  teacher: {
    title: "Cadastro de Professor",
    description: 'Junte-se ao time de corretores.',
  },
  admin: {
    title: "Novo Administrador",
    description: 'Cadastro de gestão do sistema.',
  },
};

interface SignUpFormProps {
  appType: AppType;
  onSubmit: (values: RegisterSchema) => Promise<void>;
}

export function SignUpForm({ appType, onSubmit }: SignUpFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const text = APP_CONFIG[appType];
  const requiresExtraFields = appType === 'student' || appType === 'teacher';

  const form = useForm({
    resolver: zodResolver(registerSchema),
    mode: "onChange",
    defaultValues: {
      name: '',
      email: '',
      document: '',
      phone: '',
      password: '',
      confirmPassword: '',
      terms: false,
      role: ROLE_MAP[appType],
    },
  });

  const { isValid, isSubmitting, errors } = form.formState;

  const handleSubmit = async (values: RegisterSchema) => {
    try {
      form.clearErrors("root");
      await onSubmit(values);
    } catch (error: any) {
      const { title, description } = getErrorMessage(error);

      toast.error(title, {
        description: description,
        duration: 5000
      });

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
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-700 uppercase tracking-wider text-[13px]">
                      Nome Completo
                    </FormLabel>

                    <FormControl>
                      <Input
                        className={`w-full rounded-2xl h-12 p-3.5 ${inputFocusClass}`}
                        placeholder="Digite seu nome completo"
                        {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                        {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {requiresExtraFields && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <FormField
                    control={form.control}
                    name="document"

                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-700 uppercase tracking-wider text-[13px]">CPF</FormLabel>
                        <FormControl>
                          <Input
                            className={`w-full rounded-2xl h-12 p-3.5 ${inputFocusClass}`}
                            placeholder="000.000.000-00"
                            maxLength={14}
                            inputMode="numeric"
                            {...field}
                            onChange={(e) => {
                              const maskedValue = formatCPF(e.target.value);
                              field.onChange(maskedValue);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-700 uppercase tracking-wider text-[13px]">Celular</FormLabel>
                        <FormControl>
                          <Input
                            className={`w-full rounded-2xl h-12 p-3.5 ${inputFocusClass}`}
                            placeholder="(00) 00000-0000"
                            maxLength={15}
                            inputMode="numeric"

                            {...field}
                            onChange={(e) => {
                              const maskedValue = formatPhone(e.target.value);
                              field.onChange(maskedValue);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

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
                          placeholder="Crie uma senha segura"
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


              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-700 uppercase tracking-wider text-[13px]">Confirmar Senha</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          className={`w-full rounded-2xl h-12 p-3.5 ${inputFocusClass}`}
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Confirme sua senha"
                          {...field}
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
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                        Eu concordo com os Termos de Uso e Políticas de Privacidade da plataforma.
                      </FormLabel>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                variant={appType !== 'admin' ? 'default' : 'secondary'}
                className="w-full font-bold h-12 rounded-xl text-[16px]"
                disabled={isSubmitting || !isValid}
                isLoading={isSubmitting}
                loadingText="Criando conta..."
              >
                Cadastrar
              </Button>
            </form>
          </Form>
        </CardContent>



        <CardFooter className="flex flex-col justify-center p-0">
          <div className="w-full pt-4 border-t border-[#e8e4ce] text-center text-sm">
            <p>
              Já tem uma conta?
              <Link
                href="/login"
                className={`${appType === 'admin' ? 'text-secondary' : 'text-primary'} font-medium hover:underline ml-1`}
              >
                Faça login
              </Link>
            </p>
          </div>
        </CardFooter>
      </Card >
    </div >
  );
}