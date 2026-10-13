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
        className="h-14 w-full rounded-2xl bg-blue-600 text-sm font-bold text-white shadow-sm hover:bg-blue-700"
      >
        <FileText className="mr-2 size-5" /> Ver Comprovante de Pagamento
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
