"use client";

import { FreeCreditReminderModal } from "@/components/free-credit-reminder-modal";
import { MentorshipCreditsReminderModal } from "@/components/mentorship-credits-reminder-modal";
import {
  OnboardingModal,
  type OnboardingCompletionResult,
} from "@/components/onboarding-modal";
import { useState } from "react";

type FlowState =
  | { step: "ONBOARDING" }
  | { step: "MENTORSHIP_REMINDER" }
  | {
    step: "FREE_CREDIT_REMINDER";
    freeCreditExpiresAt: string;
  }
  | { step: "CLOSED" };

interface StudentOnboardingFlowProps {
  initialOnboardingCompleted: boolean;
  onOnboardingCompleted: () => void;
}

export function StudentOnboardingFlow({
  initialOnboardingCompleted,
  onOnboardingCompleted,
}: StudentOnboardingFlowProps) {
  const [flowState, setFlowState] = useState<FlowState>(
    () => initialOnboardingCompleted ?
      { step: "CLOSED" } : { step: "ONBOARDING" }
  );

  const handleOnboardingCompleted = (
    result: OnboardingCompletionResult
  ) => {
    onOnboardingCompleted();

    if (
      result.nextStep ===
      "HOTMART_MENTORSHIP_REMINDER"
    ) {
      setFlowState({
        step: "MENTORSHIP_REMINDER",
      });

      return;
    }

    if (result.nextStep === "FREE_CREDIT_REMINDER") {
      setFlowState({
        step: "FREE_CREDIT_REMINDER",
        freeCreditExpiresAt: result.freeCreditExpiresAt,
      });

      return;
    }

    setFlowState({
      step: "CLOSED",
    });
  };

  const closeFlow = () => {
    setFlowState({
      step: "CLOSED",
    });
  };

  return (
    <>
      <OnboardingModal
        open={flowState.step === "ONBOARDING"}
        onCompleted={handleOnboardingCompleted}
      />

      <MentorshipCreditsReminderModal
        open={flowState.step === "MENTORSHIP_REMINDER"}
        onClose={closeFlow}
      />

      {flowState.step ===
        "FREE_CREDIT_REMINDER" && (
          <FreeCreditReminderModal
            open
            freeCreditExpiresAt={flowState.freeCreditExpiresAt}
            onClose={closeFlow}
          />
        )}
    </>
  );
}