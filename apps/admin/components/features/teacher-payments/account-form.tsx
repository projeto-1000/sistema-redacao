"use client";

import { toast } from "sonner";
import type { AccountFormValues } from "@repo/validators";
import { PaymentAccountForm } from "@repo/ui/components/features/teacher-payments/payment-account-form";
import { createPaymentAccount, updatePaymentAccount } from "@/app/actions/payment-accounts";
import type { PaymentAccount } from "@/types";

interface AccountFormProps {
  teacherId: string;
  initialData?: PaymentAccount | null;
  onCancel: () => void;
}

export function AccountForm({ teacherId, initialData, onCancel }: AccountFormProps) {
  const submit = async (values: AccountFormValues) => {
    const result = initialData
      ? await updatePaymentAccount(initialData.id, teacherId, values)
      : await createPaymentAccount(teacherId, values);

    if (result.success) {
      toast.success(
        initialData ? "Conta atualizada com sucesso." : "Conta cadastrada com sucesso."
      );
      onCancel();
    }

    return result;
  };

  return <PaymentAccountForm initialData={initialData} onCancel={onCancel} onSubmit={submit} />;
}
