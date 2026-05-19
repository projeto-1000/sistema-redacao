"use client";

import { Button } from "@repo/ui/components/button";
import { FileText } from "lucide-react";
import { PaymentRegistrationModal } from "./payment-registration-modal";
import { AccountData, type PaymentMetrics } from "@/types";

interface PaymentActionsProps {
  teacherId: string;
  month: string;
  metrics: PaymentMetrics & { receiptUrl?: string };
  accounts: AccountData[];
}

export function PaymentActions({ teacherId, month, metrics, accounts }: PaymentActionsProps) {
  const isPaid = metrics.status === "paid";

  if (isPaid) {
    return (
      <Button
        onClick={() => metrics.receiptUrl && window.open(metrics.receiptUrl, "_blank")}
        className="w-full h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-sm"
      >
        <FileText className="size-5 mr-2" /> Ver Comprovante de Pagamento
      </Button>
    );
  }

  return (
    <PaymentRegistrationModal
      teacherId={teacherId}
      month={month}
      metrics={metrics}
      accounts={accounts}
    />
  );
}