"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Pencil, Plus, Trash2 } from "lucide-react";
import type { PaymentAccount } from "@/types";
import { Button } from "@repo/ui/components/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@repo/ui/components/dialog";
import { PaymentAccountsList } from "@repo/ui/components/features/teacher-payments/payment-accounts-list";
import { toast } from "sonner";
import { deletePaymentAccount, setDefaultPaymentAccount } from "@/app/actions/payment-accounts";
import { AccountForm } from "./account-form";

interface AdminPaymentAccountsManagerProps {
  teacherId: string;
  accounts: PaymentAccount[];
}

export function AdminPaymentAccountsManager({
  teacherId,
  accounts,
}: AdminPaymentAccountsManagerProps) {
  const [editing, setEditing] = useState<PaymentAccount | "new" | null>(null);
  const [isPending, startTransition] = useTransition();

  const setDefault = (accountId: string) =>
    startTransition(async () => {
      const result = await setDefaultPaymentAccount(accountId, teacherId);
      if (result.success) toast.success("Conta principal atualizada.");
      else toast.error(result.error);
    });

  const remove = (accountId: string) => {
    if (!window.confirm("Tem certeza que deseja excluir esta conta?")) return;

    startTransition(async () => {
      const result = await deletePaymentAccount(accountId, teacherId);
      if (result.success) toast.success("Conta excluída com sucesso.");
      else toast.error(result.error);
    });
  };

  return (
    <>
      <PaymentAccountsList
        accounts={accounts}
        createAction={
          <Button onClick={() => setEditing("new")} className="rounded-xl font-bold">
            <Plus className="size-4" /> Adicionar conta
          </Button>
        }
        renderActions={(account) => (
          <>
            {!account.is_default && (
              <Button
                variant="outline"
                onClick={() => setDefault(account.id)}
                disabled={isPending}
                className="rounded-xl font-bold text-emerald-700"
              >
                <CheckCircle2 className="size-4" /> Tornar principal
              </Button>
            )}
            <Button
              variant="outline"
              size="icon"
              onClick={() => setEditing(account)}
              disabled={isPending}
              aria-label="Editar conta"
              className="rounded-xl text-blue-600"
            >
              <Pencil className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => remove(account.id)}
              disabled={isPending}
              aria-label="Excluir conta"
              className="rounded-xl text-red-600"
            >
              <Trash2 className="size-4" />
            </Button>
          </>
        )}
      />

      <Dialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-h-[90dvh] max-w-2xl overflow-y-auto rounded-4xl border-none p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black">
              {editing === "new" ? "Adicionar conta" : "Editar conta"}
            </DialogTitle>
          </DialogHeader>
          <AccountForm
            teacherId={teacherId}
            initialData={editing === "new" ? null : editing}
            onCancel={() => setEditing(null)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
