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
import {
  DEFAULT_PHONE_COUNTRY_CODE,
  formatCPF,
  formatPhone,
  getErrorMessage,
  getPhoneCountryCodeOptions,
  onlyDigits,
} from "@repo/utils";
import { Checkbox } from "./checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";
import { toast } from "sonner";
import { PasswordRequirements } from "./password-requirements";

type AppType = "admin" | "teacher" | "student";

const APP_CONFIG: Record<AppType, { title: string; description: string }> = {
  student: {
    title: "Crie sua conta",
    description: "Junte-se aos nossos estudantes e melhore suas redações hoje mesmo.",
  },
  teacher: {
    title: "Cadastro de Professor",
    description: "Junte-se ao time de corretores.",
  },
  admin: {
    title: "Novo Administrador",
    description: "Cadastro de gestão do sistema.",
  },
};

const PHONE_COUNTRY_CODE_OPTIONS = getPhoneCountryCodeOptions();

type SignUpInitialValues = Partial<
  Pick<RegisterSchema, "name" | "email" | "document" | "phoneCountryCode" | "phone">
>;

interface SignUpLockedFields {
  email?: boolean;
}

interface SignUpFormProps {
  appType: AppType;
  onSubmit: (values: RegisterSchema) => Promise<void>;
  title?: string;
  description?: string;
  submitLabel?: string;
  loadingText?: string;
  initialValues?: SignUpInitialValues;
  lockedFields?: SignUpLockedFields;
  isPending?: boolean;
}

export function SignUpForm({
  appType,
  onSubmit,
  title,
  description,
  submitLabel = "Cadastrar",
  loadingText = "Criando conta...",
  initialValues,
  lockedFields,
  isPending = false,
}: SignUpFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const text = {
    title: title ?? APP_CONFIG[appType].title,
    description: description ?? APP_CONFIG[appType].description,
  };

  const form = useForm({
    resolver: zodResolver(registerSchema),
    mode: "onChange",
    defaultValues: {
      name: initialValues?.name ?? "",
      email: initialValues?.email ?? "",
      document: initialValues?.document ?? "",
      phoneCountryCode: initialValues?.phoneCountryCode ?? DEFAULT_PHONE_COUNTRY_CODE,
      phone: initialValues?.phone ?? "",
      password: "",
      confirmPassword: "",
      terms: false,
    },
  });

  const { isValid, isSubmitting } = form.formState;

  const isLoading = isSubmitting || isPending;

  const selectedPhoneCountryCode = form.watch("phoneCountryCode");
  const password = form.watch("password");
  const isBrazilianPhone = selectedPhoneCountryCode === DEFAULT_PHONE_COUNTRY_CODE;

  const handleSubmit = async (values: RegisterSchema) => {
    try {
      form.clearErrors("root");
      await onSubmit(values);
    } catch (error: unknown) {
      const { title, description } = getErrorMessage(error);

      toast.error(title, {
        description: description,
        duration: 5000,
      });
    }
  };

  const inputFocusClass =
    "focus-visible:ring-primary focus-visible:border-primary focus-visible:ring-1";

  return (
    <div className="flex w-full max-w-[500px] flex-col items-center">
      <Logo className="mb-8 h-20 md:h-22" />

      <Card className="w-full rounded-xl border border-slate-100 bg-white px-5 py-6 shadow-xl md:px-6 md:py-8">
        <CardHeader className="gap-2 text-center">
          <CardTitle className="text-2xl leading-tight font-bold">{text.title}</CardTitle>
          <CardDescription className="text-sm text-slate-500 sm:text-base md:text-[16px]">
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
                    <FormLabel className="text-[13px] tracking-wider text-slate-700 uppercase">
                      Nome Completo
                    </FormLabel>

                    <FormControl>
                      <Input
                        className={`h-12 w-full rounded-2xl p-3.5 ${inputFocusClass}`}
                        placeholder="Digite seu nome completo"
                        {...field}
                      />
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
                    <FormLabel className="text-[13px] tracking-wider text-slate-700 uppercase">
                      E-mail
                    </FormLabel>
                    <FormControl>
                      <Input
                        className={`h-12 w-full rounded-2xl p-3.5 ${inputFocusClass}`}
                        placeholder="seu@email.com"
                        readOnly={lockedFields?.email}
                        aria-readonly={lockedFields?.email}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="document"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[13px] tracking-wider text-slate-700 uppercase">
                      CPF
                    </FormLabel>

                    <FormControl>
                      <Input
                        className={`h-12 w-full rounded-2xl p-3.5 ${inputFocusClass}`}
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

              <div className="grid grid-cols-[104px_minmax(0,1fr)] gap-3">
                <FormField
                  control={form.control}
                  name="phoneCountryCode"
                  render={({ field }) => (
                    <FormItem className="min-w-0">
                      <FormLabel className="text-[13px] tracking-wider text-slate-700 uppercase">
                        País
                      </FormLabel>

                      <Select
                        value={field.value}
                        onValueChange={(value) => {
                          field.onChange(value);
                          form.setValue("phone", "", {
                            shouldDirty: true,
                            shouldValidate: true,
                          });
                        }}
                      >
                        <FormControl>
                          <SelectTrigger
                            className={`min-h-12 w-full overflow-hidden rounded-2xl p-3.5 [&>span]:truncate ${inputFocusClass}`}
                          >
                            <SelectValue placeholder="+55" />
                          </SelectTrigger>
                        </FormControl>

                        <SelectContent>
                          {PHONE_COUNTRY_CODE_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.display}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem className="min-w-0">
                      <FormLabel className="text-[13px] tracking-wider text-slate-700 uppercase">
                        Celular
                      </FormLabel>

                      <FormControl>
                        <Input
                          className={`h-12 w-full rounded-2xl p-3.5 ${inputFocusClass}`}
                          placeholder={
                            isBrazilianPhone ? "(00) 00000-0000" : "Digite somente números"
                          }
                          maxLength={isBrazilianPhone ? 15 : 20}
                          inputMode="numeric"
                          {...field}
                          onChange={(e) => {
                            const value = isBrazilianPhone
                              ? formatPhone(e.target.value)
                              : onlyDigits(e.target.value).slice(0, 20);

                            field.onChange(value);
                          }}
                        />
                      </FormControl>

                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

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
                          className={`h-12 w-full rounded-2xl p-3.5 ${inputFocusClass}`}
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

              <PasswordRequirements password={password} />

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
                          className={`h-12 w-full rounded-2xl p-3.5 ${inputFocusClass}`}
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
                className="h-12 w-full rounded-xl text-[16px] font-bold"
                disabled={isLoading || !isValid}
                isLoading={isLoading}
                loadingText={loadingText}
              >
                {submitLabel}
              </Button>
            </form>
          </Form>
        </CardContent>

        <CardFooter className="flex flex-col justify-center p-0">
          <div className="w-full border-t border-[#e8e4ce] pt-4 text-center text-sm">
            <p>
              Já tem uma conta?
              <Link href="/login" className="text-primary ml-1 font-medium hover:underline">
                Faça login
              </Link>
            </p>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
