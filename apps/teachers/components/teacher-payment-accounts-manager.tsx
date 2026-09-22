"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Pencil, Plus, Trash2 } from "lucide-react";
import type { TeacherPaymentAccount } from "@repo/types";
import type { AccountFormValues } from "@repo/validators";
import { Button } from "@repo/ui/components/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@repo/ui/components/dialog";
import { PaymentAccountForm } from "@repo/ui/components/features/teacher-payments/payment-account-form";
import { PaymentAccountsList } from "@repo/ui/components/features/teacher-payments/payment-accounts-list";
import { toast } from "sonner";
import {
  createOwnPaymentAccount,
  deleteOwnPaymentAccount,
  setOwnDefaultPaymentAccount,
  updateOwnPaymentAccount,
} from "@/app/actions/payments";

export function TeacherPaymentAccountsManager({ accounts }: { accounts: TeacherPaymentAccount[] }) {
  const [editing, setEditing] = useState<TeacherPaymentAccount | "new" | null>(null);
  const [isPending, startTransition] = useTransition();

  const submit = async (values: AccountFormValues) => {
    const result = editing === "new" ? await createOwnPaymentAccount(values) : await updateOwnPaymentAccount(editing!.id, values);
    if (result.success) {
      toast.success(editing === "new" ? "Conta cadastrada com sucesso." : "Conta atualizada com sucesso.");
      setEditing(null);
    }
    return result;
  };

  const setDefault = (accountId: string) => startTransition(async () => {
    const result = await setOwnDefaultPaymentAccount(accountId);
    if (result.success) toast.success("Conta principal atualizada.");
    else toast.error(result.error);
  });

  const remove = (accountId: string) => {
    if (!window.confirm("Tem certeza que deseja excluir esta conta?")) return;
    startTransition(async () => {
      const result = await deleteOwnPaymentAccount(accountId);
      if (result.success) toast.success("Conta excluída com sucesso.");
      else toast.error(result.error);
    });
  };

  return (
    <>
      <PaymentAccountsList
        accounts={accounts}
        createAction={<Button onClick={() => setEditing("new")} className="rounded-xl font-bold"><Plus className="size-4" /> Adicionar conta</Button>}
        renderActions={(account) => (
          <>
            {!account.is_default && <Button variant="outline" onClick={() => setDefault(account.id)} disabled={isPending} className="rounded-xl font-bold text-emerald-700"><CheckCircle2 className="size-4" /> Tornar principal</Button>}
            <Button variant="outline" size="icon" onClick={() => setEditing(account)} disabled={isPending} className="rounded-xl text-blue-600"><Pencil className="size-4" /></Button>
            <Button variant="outline" size="icon" onClick={() => remove(account.id)} disabled={isPending} className="rounded-xl text-red-600"><Trash2 className="size-4" /></Button>
          </>
        )}
      />

      <Dialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-h-[90dvh] max-w-2xl overflow-y-auto rounded-4xl border-none p-6 shadow-2xl">
          <DialogHeader><DialogTitle className="text-2xl font-black">{editing === "new" ? "Adicionar conta" : "Editar conta"}</DialogTitle></DialogHeader>
          <PaymentAccountForm initialData={editing === "new" ? null : editing} onCancel={() => setEditing(null)} onSubmit={submit} />
        </DialogContent>
      </Dialog>
    </>
  );
}
