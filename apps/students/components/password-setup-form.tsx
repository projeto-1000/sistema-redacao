"use client";

import { captureRegistrationAttribution } from "@repo/utils/registration-tracking";
import { trackCompleteRegistration } from "@/lib/meta-pixel";
import { completeOrganicSignup } from "@/app/actions/organic-signup";
import { PasswordSetupForm as SharedPasswordSetupForm } from "@repo/ui/components/features/auth/password-setup-form";

export function PasswordSetupForm({ token }: { token: string }) {
  return (
    <SharedPasswordSetupForm
      loginHref="/login"
      onSubmitAction={async (values) => {
        const result = await completeOrganicSignup({
          token,
          ...values,
          attribution: captureRegistrationAttribution(),
        });
        if (result.success) trackCompleteRegistration(result.eventId);
        return result;
      }}
    />
  );
}
