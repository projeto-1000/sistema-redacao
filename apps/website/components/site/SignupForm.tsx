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
import {
  ArrowRight,
  Check,
  CircleAlert,
  LogIn,
  MessageCircle,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { getStudentsUrl, SUPPORT_URL } from "@/lib/site-links";

const countryCodeOptions = getPhoneCountryCodeOptions();
const fieldLabelClassName =
  "text-xs font-bold uppercase tracking-wide text-foreground/70";
const fieldControlClassName =
  "h-[50px]! rounded-[1rem] border-border bg-background px-[1.1rem] py-[0.9rem] text-[0.95rem]! shadow-none focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/20";

type DuplicateCode = "DOCUMENT_ALREADY_REGISTERED" | "EMAIL_ALREADY_REGISTERED";

type AttemptsResponse = {
  code?: DuplicateCode;
  error?: string;
  continuationUrl?: string;
};

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
      <Card className="border-border bg-card shadow-(--shadow-card)">
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
    <Card className="card-soft gap-0 p-6 sm:p-8">
      <CardHeader className="gap-0 p-0">
        <CardTitle className="font-display text-2xl font-extrabold leading-normal">
          Criar minha conta grátis
        </CardTitle>
        <p className="mt-2 text-sm text-muted-foreground">
          1 crédito de correção humana. Sem cartão de crédito.
        </p>
      </CardHeader>
      <CardContent className="mt-6 p-0">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="grid gap-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="gap-1.5">
                  <FormLabel className={fieldLabelClassName}>
                    NOME COMPLETO
                  </FormLabel>
                  <FormControl>
                    <Input
                      autoComplete="name"
                      placeholder="Como podemos te chamar?"
                      className={fieldControlClassName}
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
                <FormItem className="gap-1.5">
                  <FormLabel className={fieldLabelClassName}>E-MAIL</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      placeholder="seuemail@exemplo.com"
                      className={fieldControlClassName}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phoneCountryCode"
              render={({ field: countryCodeField }) => (
                <FormItem className="gap-1.5">
                  <FormLabel className={fieldLabelClassName}>
                    WHATSAPP
                  </FormLabel>
                  <div className="grid grid-cols-[108px_minmax(0,1fr)] items-start gap-3">
                    <Select
                      value={countryCodeField.value}
                      onValueChange={(value) => {
                        countryCodeField.onChange(value);
                        form.setValue("phone", "", {
                          shouldDirty: true,
                          shouldValidate: true,
                        });
                      }}
                    >
                      <FormControl>
                        <SelectTrigger
                          aria-label="Código do país"
                          className={`w-full ${fieldControlClassName}`}
                        >
                          <SelectValue placeholder="+55">
                            {
                              countryCodeOptions.find(
                                (option) =>
                                  option.value === countryCodeField.value,
                              )?.display
                            }
                          </SelectValue>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent
                        position="popper"
                        align="start"
                        sideOffset={6}
                        className="max-h-[300px]! w-[min(20rem,calc(100vw-2rem))] max-w-[calc(100vw-2rem)] overflow-y-auto border-primary/20"
                      >
                        {countryCodeOptions.map((option) => (
                          <SelectItem
                            key={option.value}
                            value={option.value}
                            className="min-h-10 px-3 py-2.5 pr-9 focus:bg-primary/10 focus:text-primary data-[state=checked]:bg-primary/10 data-[state=checked]:font-semibold data-[state=checked]:text-primary [&>span:last-child]:min-w-0 [&>span:last-child]:flex-1 [&>span:last-child]:overflow-hidden"
                          >
                            <span
                              className="block truncate"
                              title={`${option.display} · ${option.label}`}
                            >
                              {option.display} · {option.label}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem className="min-w-0 gap-1.5">
                          <FormControl>
                            <Input
                              aria-label="WhatsApp"
                              inputMode="numeric"
                              maxLength={isBrazil ? 15 : 20}
                              placeholder={
                                isBrazil
                                  ? "(11) 91234-5678"
                                  : "Digite somente números"
                              }
                              className={fieldControlClassName}
                              {...field}
                              onChange={(event) =>
                                field.onChange(
                                  isBrazil
                                    ? formatPhone(event.target.value)
                                    : onlyDigits(event.target.value).slice(
                                      0,
                                      20,
                                    ),
                                )
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="document"
              render={({ field }) => (
                <FormItem className="gap-1.5">
                  <FormLabel className={fieldLabelClassName}>CPF</FormLabel>
                  <FormControl>
                    <Input
                      inputMode="numeric"
                      maxLength={14}
                      placeholder="000.000.000-00"
                      className={fieldControlClassName}
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
            <FormField
              control={form.control}
              name="terms"
              render={({ field }) => (
                <FormItem className="gap-0">
                  <div className="flex items-start gap-3">
                    <FormControl>
                      <Checkbox
                        className="mt-0.5"
                        checked={field.value}
                        onCheckedChange={(checked) =>
                          field.onChange(checked === true)
                        }
                      />
                    </FormControl>
                    <div className="min-w-0">
                      <FormLabel className="block text-xs font-normal leading-relaxed text-muted-foreground">
                        Autorizo o contato do Projeto 1000 por WhatsApp e e-mail
                        e aceito a{" "}
                        <Link
                          href="/privacidade"
                          className="font-semibold text-primary hover:underline"
                        >
                          Política de Privacidade
                        </Link>
                        .
                      </FormLabel>
                      <FormMessage className="mt-1.5" />
                    </div>
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
              className="press-fx arrow-slide mt-1 h-auto w-full rounded-full px-6 py-4 text-sm font-bold"
              disabled={!form.formState.isValid}
              isLoading={form.formState.isSubmitting}
              loadingText="Enviando..."
            >
              Criar minha conta gratuita <ArrowRight className="h-4 w-4" />
            </Button>

            <ul className="mt-1 grid gap-2 text-xs text-muted-foreground">
              {[
                "Correção individual feita por professor",
                "Nota nas cinco competências do Enem",
                "Próximos passos e tarefa de reescrita",
              ].map((benefit) => (
                <li key={benefit} className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 shrink-0 text-primary" />
                  {benefit}
                </li>
              ))}
            </ul>

            <p className="mt-1 text-center text-xs text-muted-foreground">
              Já tem uma conta?{" "}
              {loginUrl ? (
                <a
                  href={loginUrl}
                  className="font-semibold text-primary hover:underline"
                >
                  Entrar na plataforma
                </a>
              ) : (
                <span className="font-semibold text-primary">
                  Entrar na plataforma
                </span>
              )}
            </p>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
