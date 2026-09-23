"use client";

import type { PaymentAccount } from "@/types";
import { PaymentAccountsManager } from "@repo/ui/components/features/teacher-payments/payment-accounts-manager";
import {
  createPaymentAccount,
  deletePaymentAccount,
  setDefaultPaymentAccount,
  updatePaymentAccount,
} from "@/app/actions/payment-accounts";

interface AdminPaymentAccountsManagerProps {
  teacherId: string;
  accounts: PaymentAccount[];
}

export function AdminPaymentAccountsManager({
  teacherId,
  accounts,
}: AdminPaymentAccountsManagerProps) {
  return (
    <PaymentAccountsManager
      accounts={accounts}
      createAccount={(values) => createPaymentAccount(teacherId, values)}
      updateAccount={(accountId, values) => updatePaymentAccount(accountId, teacherId, values)}
      deleteAccount={(accountId) => deletePaymentAccount(accountId, teacherId)}
      setDefaultAccount={(accountId) => setDefaultPaymentAccount(accountId, teacherId)}
    />
  );
}
