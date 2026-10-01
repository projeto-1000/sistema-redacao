"use client";

import { useFormStatus } from "react-dom";

import { Button } from "@repo/ui/components/button";

interface SubscriptionWithdrawalSubmitButtonProps {
  isRetry: boolean;
  isReconcile?: boolean;
}

export function SubscriptionWithdrawalSubmitButton({
  isRetry,
  isReconcile = false,
}: SubscriptionWithdrawalSubmitButtonProps) {
  const { pending } = useFormStatus();
  const label = isReconcile
    ? "Verificar confirmação"
    : isRetry
      ? "Tentar reembolso novamente"
      : "Aprovar e reembolsar";
  const loadingText = isReconcile
    ? "Verificando confirmação..."
    : isRetry
      ? "Tentando reembolso..."
      : "Aprovando e reembolsando...";

  return (
    <Button type="submit" className="w-full" isLoading={pending} loadingText={loadingText}>
      {label}
    </Button>
  );
}
