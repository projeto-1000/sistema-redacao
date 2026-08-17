"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  DEFAULT_PHONE_COUNTRY_CODE,
  formatCPF,
  formatPhone,
  getPhoneCountryCodeOptions,
  onlyDigits,
} from "@repo/utils";
import {
  registrationDetailsSchema,
  type RegistrationDetailsSchema,
} from "@repo/validators";
import { Alert, AlertDescription, AlertTitle } from "@repo/ui/components/alert";
import { Button } from "@repo/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/select";
import { ArrowRight, CircleAlert, LogIn, MessageCircle } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { upsertWebsiteLead } from "@/lib/leads.actions";
import { getStudentsUrl, SUPPORT_URL } from "@/lib/site-links";

const countryCodeOptions = getPhoneCountryCodeOptions();

type DuplicateCode = "DOCUMENT_ALREADY_REGISTERED" | "EMAIL_ALREADY_REGISTERED";

type AttemptsResponse = {
  code?: DuplicateCode;
  error?: string;
  continuationUrl?: string;
};

function captureUtms() {
  const utm: Record<string, string> = {};
  const params = new URLSearchParams(window.location.search);

  for (const [key, value] of params.entries()) {
    if (key.startsWith("utm_")) utm[key] = value.slice(0, 200);
  }

  return utm;
}

export function SignupForm() {
  const [duplicateCode, setDuplicateCode] = useState<DuplicateCode | null>(
    null,
  );
  const form = useForm({
    resolver: zodResolver(registrationDetailsSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      email: "",
      document: "",
      phoneCountryCode: DEFAULT_PHONE_COUNTRY_CODE,
      phone: "",
      terms: false,
    },
  });

  const selectedCountryCode = form.watch("phoneCountryCode");
  const isBrazil = selectedCountryCode === DEFAULT_PHONE_COUNTRY_CODE;
  const loginUrl = getStudentsUrl("/login");

  async function onSubmit(registration: RegistrationDetailsSchema) {
    form.clearErrors("root");
    setDuplicateCode(null);

    const leadResult = await upsertWebsiteLead({
      registration,
      utm: captureUtms(),
    });

    if (!leadResult.ok) {
      form.setError("root", { message: leadResult.error });
      return;
    }

    const studentsUrl = getStudentsUrl("/api/signup/attempts");

    if (!studentsUrl) {
      form.setError("root", {
        message:
          "O cadastro está temporariamente indisponível. Tente novamente em instantes.",
      });
      return;
    }

    try {
      const response = await fetch(studentsUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(registration),
      });
      const result = (await response.json()) as AttemptsResponse;

      if (
        response.status === 409 &&
        (result.code === "DOCUMENT_ALREADY_REGISTERED" ||
          result.code === "EMAIL_ALREADY_REGISTERED")
      ) {
        setDuplicateCode(result.code);
        return;
      }

      if (!response.ok || !result.continuationUrl) {
        form.setError("root", {
          message:
            result.error ??
            "Não foi possível iniciar o cadastro no momento. Tente novamente.",
        });
        return;
      }

      window.location.assign(result.continuationUrl);
    } catch {
      form.setError("root", {
        message:
          "Não foi possível conectar ao cadastro no momento. Tente novamente.",
      });
    }
  }

  if (duplicateCode) {
    const isDocument = duplicateCode === "DOCUMENT_ALREADY_REGISTERED";

    return (
      <Card className="border-border bg-card shadow-[var(--shadow-card)]">
        <CardHeader>
          <span className="icon-bubble mb-3 h-12 w-12 bg-pastel-yellow">
            <CircleAlert className="h-6 w-6 text-foreground" />
          </span>
          <CardTitle className="font-display text-2xl">
            {isDocument ? "CPF já cadastrado" : "E-mail já cadastrado"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <p className="leading-relaxed text-muted-foreground">
            {isDocument
              ? "Encontramos uma conta do Projeto 1000 associada a este CPF."
              : "Encontramos uma conta do Projeto 1000 associada a este e-mail."}{" "}
            Se você já possui conta, entre normalmente. Se não reconhece o
            cadastro ou não lembra qual e-mail utilizou, fale com nosso suporte.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            {loginUrl ? (
              <a
                href={loginUrl}
                className="press-fx inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground"
              >
                <LogIn className="h-4 w-4" /> Entrar na minha conta
              </a>
            ) : (
              <Button type="button" disabled>
                Entrar na minha conta
              </Button>
            )}
            <a
              href={SUPPORT_URL}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-border px-6 py-3.5 text-sm font-semibold text-foreground hover:border-primary/50"
            >
              <MessageCircle className="h-4 w-4" /> Falar com o suporte
            </a>
          </div>
          <Button
            type="button"
            variant="ghost"
            onClick={() => setDuplicateCode(null)}
          >
            Corrigir meus dados
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className="border-border bg-card shadow-[var(--shadow-card)]"
      id="signup"
    >
      <CardHeader>
        <CardTitle className="font-display text-2xl">
          Crie sua conta gratuita
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Preencha seus dados. Sua senha será definida na próxima etapa.
        </p>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome completo</FormLabel>
                  <FormControl>
                    <Input
                      autoComplete="name"
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
                  <FormLabel>E-mail</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      autoComplete="email"
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
              name="document"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CPF</FormLabel>
                  <FormControl>
                    <Input
                      inputMode="numeric"
                      maxLength={14}
                      placeholder="000.000.000-00"
                      {...field}
                      onChange={(event) =>
                        field.onChange(formatCPF(event.target.value))
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-[112px_minmax(0,1fr)] gap-3">
              <FormField
                control={form.control}
                name="phoneCountryCode"
                render={({ field }) => (
                  <FormItem className="min-w-0">
                    <FormLabel>País</FormLabel>
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
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="+55" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {countryCodeOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.display} · {option.label}
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
                    <FormLabel>WhatsApp</FormLabel>
                    <FormControl>
                      <Input
                        inputMode="numeric"
                        maxLength={isBrazil ? 15 : 20}
                        placeholder={
                          isBrazil
                            ? "(00) 00000-0000"
                            : "Digite somente números"
                        }
                        {...field}
                        onChange={(event) =>
                          field.onChange(
                            isBrazil
                              ? formatPhone(event.target.value)
                              : onlyDigits(event.target.value).slice(0, 20),
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="terms"
              render={({ field }) => (
                <FormItem className="flex items-start gap-3 rounded-xl border border-border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={(checked) =>
                        field.onChange(checked === true)
                      }
                    />
                  </FormControl>
                  <div className="space-y-1">
                    <FormLabel className="normal-case leading-relaxed">
                      Li e aceito os{" "}
                      <Link href="/termos" className="text-primary underline">
                        Termos de Uso
                      </Link>{" "}
                      e a{" "}
                      <Link
                        href="/privacidade"
                        className="text-primary underline"
                      >
                        Política de Privacidade
                      </Link>
                      .
                    </FormLabel>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />
            {form.formState.errors.root?.message && (
              <Alert variant="destructive">
                <AlertTitle>Não foi possível continuar</AlertTitle>
                <AlertDescription>
                  {form.formState.errors.root.message}
                </AlertDescription>
              </Alert>
            )}
            <Button
              type="submit"
              size="lg"
              className="arrow-slide w-full rounded-full"
              disabled={form.formState.isSubmitting || !form.formState.isValid}
            >
              {form.formState.isSubmitting ? (
                "Continuando..."
              ) : (
                <>
                  Continuar para criar senha <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
