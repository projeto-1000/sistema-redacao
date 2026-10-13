"use client";

import type { TeacherPaymentAccount } from "@repo/types";
import { PaymentAccountsManager } from "@repo/ui/components/features/teacher-payments/payment-accounts-manager";
import {
  createOwnPaymentAccount,
  deleteOwnPaymentAccount,
  setOwnDefaultPaymentAccount,
  updateOwnPaymentAccount,
} from "@/app/actions/payments";

export function TeacherPaymentAccountsManager({ accounts }: { accounts: TeacherPaymentAccount[] }) {
  return (
    <PaymentAccountsManager
      accounts={accounts}
      createAccount={createOwnPaymentAccount}
      updateAccount={updateOwnPaymentAccount}
      deleteAccount={deleteOwnPaymentAccount}
      setDefaultAccount={setOwnDefaultPaymentAccount}
    />
  );
}
