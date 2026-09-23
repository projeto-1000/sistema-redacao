"use client";

import { Suspense } from "react";
import { useAuth } from "@/hooks/use-auth";
import { LoginForm } from "@repo/ui/components/login-form";
import type { LoginSchema } from "@repo/validators";
import { Logo } from "@repo/ui/components/logo";
import { ChartNoAxesColumnIncreasing, Target, UsersRound } from "lucide-react";
import { useSearchParams } from "next/navigation";

const LOGIN_BENEFITS = [
  {
    icon: UsersRound,
    label: "Correção 100% humana",
    iconClassName: "bg-blue-50 text-blue-600",
  },
  {
    icon: ChartNoAxesColumnIncreasing,
    label: "Evolução por competência",
    iconClassName: "bg-amber-50 text-amber-500",
  },
  {
    icon: Target,
    label: "Próximos passos claros",
    iconClassName: "bg-emerald-50 text-emerald-600",
  },
];

function LoginContent() {
  const { login, isLoggingIn, authError } = useAuth();
  const searchParams = useSearchParams();
  const urlError = searchParams.get("error");

  const error = urlError || authError;

  const handleLogin = async (values: LoginSchema) => {
    await login(values);
  };

  return (
    <>
      <title>Login - Projeto 1000</title>

      <LoginForm
        appType="student"
        onSubmit={handleLogin}
        isSubmitting={isLoggingIn}
        error={error}
      />
    </>
  );
}

export default function LoginPage() {
  return (
    <main className="auth-page-background flex min-h-dvh items-center overflow-hidden px-4 py-10 sm:px-6 lg:px-10">
      <title>Login - Projeto 1000</title>

      <div className="relative z-10 mx-auto grid w-full max-w-7xl gap-7 lg:grid-cols-[minmax(0,1fr)_minmax(420px,520px)] lg:items-center lg:gap-16">
        <section className="mx-auto w-full max-w-2xl text-center lg:mx-0 lg:text-left">
          <Logo className="mx-auto mb-8 h-20 sm:h-24 lg:mx-0" />

          <h1 className="text-4xl leading-[1.05] font-extrabold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
            Todo texto pode ir{" "}
            <span className="text-primary relative inline-block">
              mais longe.
              <span
                aria-hidden="true"
                className="border-primary absolute -bottom-2 left-0 h-3 w-full rotate-[-1deg] rounded-[50%] border-b-4"
              />
            </span>
          </h1>

          <p className="mx-auto mt-7 max-w-xl text-base leading-relaxed text-slate-500 sm:text-lg lg:mx-0">
            Veja o que já funciona, descubra o que melhorar e avance com clareza.
          </p>

          <ul className="mt-7 grid grid-cols-3 gap-2 lg:mt-8 lg:max-w-lg lg:grid-cols-1 lg:gap-3">
            {LOGIN_BENEFITS.map(({ icon: Icon, label, iconClassName }) => (
              <li
                key={label}
                className="flex min-w-0 flex-col items-center gap-2 text-center text-[11px] leading-tight font-semibold text-slate-900 sm:text-sm lg:flex-row lg:gap-3 lg:text-left lg:text-base"
              >
                <span
                  className={`flex size-9 shrink-0 items-center justify-center rounded-full lg:size-11 ${iconClassName}`}
                >
                  <Icon className="size-4 lg:size-5" />
                </span>
                <span>{label}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="flex w-full justify-center lg:justify-end">
          <Suspense
            fallback={
              <div className="h-[520px] w-full max-w-[520px] animate-pulse rounded-[28px] bg-white/60" />
            }
          >
            <LoginContent />
          </Suspense>
        </section>
      </div>
    </main>
  );
}
