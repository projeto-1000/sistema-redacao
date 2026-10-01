"use client";

import { useFormStatus } from "react-dom";

import { Button } from "@repo/ui/components/button";

interface SubscriptionWithdrawalSubmitButtonProps {
  isRetry: boolean;
}

export function SubscriptionWithdrawalSubmitButton({
  isRetry,
}: SubscriptionWithdrawalSubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      className="w-full"
      isLoading={pending}
      loadingText={isRetry ? "Tentando reembolso..." : "Aprovando e reembolsando..."}
    >
      {isRetry ? "Tentar reembolso novamente" : "Aprovar e reembolsar"}
    </Button>
  );
}
