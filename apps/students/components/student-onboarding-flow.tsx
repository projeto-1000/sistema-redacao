"use client";

import { MentorshipCreditsReminderModal } from "@/components/mentorship-credits-reminder-modal";
import { OnboardingModal } from "@/components/onboarding-modal";
import { useState } from "react";

type FlowStep =
  | "ONBOARDING"
  | "MENTORSHIP_REMINDER"
  | "CLOSED";

interface StudentOnboardingFlowProps {
  initialOnboardingCompleted: boolean;
  onOnboardingCompleted: () => void;
}

export function StudentOnboardingFlow({
  initialOnboardingCompleted,
  onOnboardingCompleted,
}: StudentOnboardingFlowProps) {
  const [step, setStep] = useState<FlowStep>(() =>
    initialOnboardingCompleted ? "CLOSED" : "ONBOARDING"
  );

  return (
    <>
      <OnboardingModal
        open={step === "ONBOARDING"}
        onCompleted={(nextStep) => {
          onOnboardingCompleted();

          if (
            nextStep === "HOTMART_MENTORSHIP_REMINDER"
          ) {
            setStep("MENTORSHIP_REMINDER");
            return;
          }

          setStep("CLOSED");
        }}
      />

      <MentorshipCreditsReminderModal
        open={step === "MENTORSHIP_REMINDER"}
        onClose={() => setStep("CLOSED")}
      />
    </>
  );
}