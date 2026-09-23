"use client";

import { useState, useTransition } from "react";
import type { TeacherPaymentAccount } from "@repo/types";
import type { AccountFormValues } from "@repo/validators";
import { CheckCircle2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@repo/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/dialog";
import { PaymentAccountForm } from "./payment-account-form";
import { PaymentAccountsList } from "./payment-accounts-list";

interface ActionResult {
  success: boolean;
  error?: string;
}

interface PaymentAccountsManagerProps {
  accounts: TeacherPaymentAccount[];
  createAccount: (values: AccountFormValues) => Promise<ActionResult>;
  updateAccount: (
    accountId: string,
    values: AccountFormValues,
  ) => Promise<ActionResult>;
  deleteAccount: (accountId: string) => Promise<ActionResult>;
  setDefaultAccount: (accountId: string) => Promise<ActionResult>;
}

export function PaymentAccountsManager({
  accounts,
  createAccount,
  updateAccount,
  deleteAccount,
  setDefaultAccount,
}: PaymentAccountsManagerProps) {
  const [editing, setEditing] = useState<TeacherPaymentAccount | "new" | null>(
    null,
  );
  const [isPending, startTransition] = useTransition();

  const submit = async (values: AccountFormValues) => {
    if (!editing) {
      return { success: false, error: "Nenhuma conta selecionada." };
    }

    const isCreating = editing === "new";
    const result = isCreating
      ? await createAccount(values)
      : await updateAccount(editing.id, values);

    if (result.success) {
      toast.success(
        isCreating
          ? "Conta cadastrada com sucesso."
          : "Conta atualizada com sucesso.",
      );
      setEditing(null);
    }

    return result;
  };

  const setDefault = (accountId: string) =>
    startTransition(async () => {
      const result = await setDefaultAccount(accountId);
      if (result.success) toast.success("Conta principal atualizada.");
      else toast.error(result.error);
    });

  const remove = (accountId: string) => {
    if (!window.confirm("Tem certeza que deseja excluir esta conta?")) return;

    startTransition(async () => {
      const result = await deleteAccount(accountId);
      if (result.success) toast.success("Conta excluída com sucesso.");
      else toast.error(result.error);
    });
  };

  return (
    <>
      <PaymentAccountsList
        accounts={accounts}
        createAction={
          <Button
            onClick={() => setEditing("new")}
            className="rounded-xl font-bold"
          >
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

      <Dialog
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
      >
        <DialogContent className="no-scrollbar max-h-[90dvh] max-w-2xl overflow-y-auto rounded-4xl border-none p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black">
              {editing === "new" ? "Adicionar conta" : "Editar conta"}
            </DialogTitle>
          </DialogHeader>
          <PaymentAccountForm
            initialData={editing === "new" ? null : editing}
            onCancel={() => setEditing(null)}
            onSubmit={submit}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
