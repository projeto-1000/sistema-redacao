"use client";

import { completeOrganicSignup } from "@/app/actions/organic-signup";
import { PasswordSetupForm as SharedPasswordSetupForm } from "@repo/ui/components/features/auth/password-setup-form";

export function PasswordSetupForm({ token }: { token: string }) {
  return (
    <SharedPasswordSetupForm
      loginHref="/login"
      onSubmitAction={(values) => completeOrganicSignup({ token, ...values })}
    />
  );
}
