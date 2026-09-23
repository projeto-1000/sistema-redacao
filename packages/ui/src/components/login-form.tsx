"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircleIcon, Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import Link from "next/link";
import { useCallback, useRef, useState } from "react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./form";
import { Input } from "./input";
import { Button } from "./button";
import { loginSchema, type LoginSchema } from "@repo/validators";
import { Alert, AlertDescription, AlertTitle } from "./alert";
import { getErrorContent } from "@repo/utils";
import { AuthFormCard } from "./auth-form-card";

type AppType = "admin" | "teacher" | "student";

const APP_CONFIG: Record<AppType, { title: string; description: string }> = {
  student: {
    title: "Acesse sua conta",
    description: "Entre com seus dados para acessar a plataforma.",
  },
  teacher: {
    title: "Área do Professor",
    description: "Acesse para gerenciar suas correções",
  },
  admin: {
    title: "Painel Administrativo",
    description: "Acesso restrito para administradores",
  },
};

interface LoginFormProps {
  appType: AppType;
  onSubmit: (values: LoginSchema) => Promise<void>;
  isSubmitting?: boolean;
  error: string | null;
}

export function LoginForm({
  appType,
  onSubmit,
  isSubmitting = false,
  error,
}: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const formElementRef = useRef<HTMLFormElement>(null);
  const submissionLockRef = useRef(false);
  const credentialPickerInteractionRef = useRef(false);

  const text = APP_CONFIG[appType];
  const errorContent = getErrorContent(error);

  const form = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const { isValid } = form.formState;

  const submitValidCredentials = useCallback(
    async (values: LoginSchema) => {
      if (isSubmitting || submissionLockRef.current) {
        return;
      }

      submissionLockRef.current = true;

      try {
        await onSubmit(values);
      } finally {
        submissionLockRef.current = false;
      }
    },
    [isSubmitting, onSubmit],
  );

  const syncCredentialsFromInputs = useCallback((): LoginSchema | null => {
    const formElement = formElementRef.current;

    if (!formElement) {
      return null;
    }

    const formData = new FormData(formElement);
    const values = {
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
    };

    form.setValue("email", values.email, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
    form.setValue("password", values.password, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });

    return values;
  }, [form]);

  const submitSelectedCredentials = useCallback(() => {
    const values = syncCredentialsFromInputs();
    const result = loginSchema.safeParse(values);

    if (!result.success) {
      return;
    }

    credentialPickerInteractionRef.current = false;
    void submitValidCredentials(result.data);
  }, [submitValidCredentials, syncCredentialsFromInputs]);

  const handleAutofill = useCallback(() => {
    if (credentialPickerInteractionRef.current) {
      submitSelectedCredentials();
      return;
    }

    syncCredentialsFromInputs();
  }, [submitSelectedCredentials, syncCredentialsFromInputs]);

  const scheduleAutofillCheck = useCallback(
    (input: HTMLInputElement) => {
      window.requestAnimationFrame(() => {
        const isAutofilled = [":autofill", ":-webkit-autofill"].some(
          (selector) => {
            try {
              return input.matches(selector);
            } catch {
              return false;
            }
          },
        );

        if (isAutofilled) {
          handleAutofill();
        }
      });
    },
    [handleAutofill],
  );

  const handleLoginInputKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (
      event.key.length === 1 ||
      event.key === "Backspace" ||
      event.key === "Delete"
    ) {
      credentialPickerInteractionRef.current = false;
    } else if (event.key === "ArrowDown") {
      credentialPickerInteractionRef.current = true;
    }

    if (event.key !== "Enter" || event.nativeEvent.isComposing) {
      return;
    }

    window.requestAnimationFrame(() => {
      if (isSubmitting || submissionLockRef.current) {
        return;
      }

      syncCredentialsFromInputs();
      formElementRef.current?.requestSubmit();
    });
  };

  const inputFocusClass =
    "focus-visible:ring-primary focus-visible:border-primary focus-visible:ring-1";

  return (
    <AuthFormCard
      title={text.title}
      description={text.description}
      footer={
        appType === "student" ? (
          <p>
            Ainda não tem uma conta?
            <Link
              className="ml-1 font-semibold text-primary hover:underline"
              href="/cadastro"
            >
              Cadastre-se
            </Link>
          </p>
        ) : undefined
      }
    >
      <Form {...form}>
        <form
          ref={formElementRef}
          autoComplete="on"
          onSubmit={form.handleSubmit(submitValidCredentials)}
          className="space-y-5"
        >
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-slate-700 uppercase tracking-wider text-[13px]">
                  E-mail
                </FormLabel>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-400" />
                  <FormControl>
                    <Input
                      className={`login-autofill-detection h-12 w-full rounded-2xl py-3.5 pl-12 pr-4 ${inputFocusClass}`}
                      type="email"
                      inputMode="email"
                      autoComplete="username"
                      enterKeyHint="next"
                      placeholder="seu@email.com"
                      {...field}
                      onPointerDown={() => {
                        credentialPickerInteractionRef.current = true;
                      }}
                      onKeyDown={handleLoginInputKeyDown}
                      onAnimationStart={(event) => {
                        if (event.animationName === "login-autofill-start") {
                          window.requestAnimationFrame(handleAutofill);
                        }
                      }}
                      onInput={(event) => {
                        field.onChange(event.currentTarget.value);
                        scheduleAutofillCheck(event.currentTarget);
                      }}
                    />
                  </FormControl>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

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
                      className={`login-autofill-detection h-12 w-full rounded-2xl py-3.5 pl-12 pr-12 ${inputFocusClass}`}
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      enterKeyHint="go"
                      placeholder="******"
                      {...field}
                      onPointerDown={() => {
                        credentialPickerInteractionRef.current = true;
                      }}
                      onKeyDown={handleLoginInputKeyDown}
                      onAnimationStart={(event) => {
                        if (event.animationName === "login-autofill-start") {
                          window.requestAnimationFrame(handleAutofill);
                        }
                      }}
                      onInput={(event) => {
                        field.onChange(event.currentTarget.value);
                        scheduleAutofillCheck(event.currentTarget);
                      }}
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

                <Link
                  href="/esqueci-minha-senha"
                  className="ml-auto mt-2 block w-fit text-sm font-semibold text-primary hover:underline"
                >
                  Esqueceu sua senha?
                </Link>
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="w-full font-bold h-12 rounded-xl text-[16px]"
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
          <AlertDescription>{errorContent.description}</AlertDescription>
        </Alert>
      )}
    </AuthFormCard>
  );
}
