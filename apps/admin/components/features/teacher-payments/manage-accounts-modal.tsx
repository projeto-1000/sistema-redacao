"use client";

import { useState, useTransition } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@repo/ui/components/dialog";
import { Button } from "@repo/ui/components/button";
import { Landmark, Plus, Pencil, Trash2, CheckCircle2, Loader2, ArrowLeft } from "lucide-react";
import { AccountForm } from "./account-form";
import { deletePaymentAccount } from "@/app/actions/payment-accounts";
import { toast } from "sonner";
import { PaymentAccount } from "@/types";

interface ManageAccountsModalProps {
  teacherId: string;
  accounts: PaymentAccount[];
}

export function ManageAccountsModal({ teacherId, accounts }: ManageAccountsModalProps) {
  const [view, setView] = useState<'list' | 'form'>('list');
  const [selectedAccount, setSelectedAccount] = useState<PaymentAccount | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleOpenCreate = () => {
    setSelectedAccount(null);
    setView('form');
  };

  const handleOpenEdit = (acc: PaymentAccount) => {
    setSelectedAccount(acc);
    setView('form');
  };

  const handleDelete = (accountId: string) => {
    if (!window.confirm("Tem certeza que deseja excluir esta conta?")) return;

    startTransition(async () => {
      const result = await deletePaymentAccount(accountId, teacherId);
      if (result.success) {
        toast.success("Conta excluída com sucesso.");
      } else {
        toast.error("Erro ao excluir conta.");
      }
    });
  };

  return (
    <Dialog onOpenChange={(isOpen) => {
      if (!isOpen) { setView('list'); setSelectedAccount(null); }
    }}

    >
      <DialogTrigger asChild>
        <Button variant="ghost" className="w-fit h-6 rounded-full hover:text-blue-600 font-bold border-0 hover:bg-transparent! transition-colors">
          <Landmark className="size-4" /> Gerenciar contas de pagamento
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl p-6 h-fit rounded-4xl border-none shadow-2xl bg-white overflow-hidden">

        <DialogHeader>
          <DialogTitle className={`flex items-center justify-between`}>

            {view === 'list' ? (
              <div>
                <h2 className="text-xl font-black tracking-tight">Contas de Pagamento</h2>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setView('list')}
                  className="rounded-full hover:bg-slate-200 shrink-0"
                >
                  <ArrowLeft className="size-5" />
                </Button>
                <div>
                  <h2 className="text-xl font-black tracking-tight">Adicionar Nova Conta</h2>
                </div>
              </div>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="no-scrollbar max-w-full max-h-[90dvh] overflow-y-auto">

          {view === 'list' && (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex justify-end">
                <Button
                  onClick={handleOpenCreate}
                  variant='secondary'
                  className="rounded-xl font-bold shadow-sm">
                  <Plus className="size-4 mr-2" /> Nova Conta
                </Button>
              </div>

              {accounts.length === 0 ? (
                <div className="text-center py-8 bg-white rounded-2xl border border-dashed border-slate-200">
                  <p className="text-sm font-bold text-slate-500">Nenhuma conta cadastrada ainda.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {accounts.map((acc) => (
                    <div key={acc.id} className="group flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-200 hover:border-blue-300 hover:shadow-sm transition-all">

                      <div className="flex items-center gap-4 overflow-hidden">
                        <div className={`size-12 rounded-full flex items-center justify-center shrink-0 ${acc.type === 'pix' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                          <Landmark className="size-5" />
                        </div>

                        <div className="flex flex-col truncate">
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className="font-bold text-sm truncate">
                              {acc.type === "pix" ? "Chave PIX" : acc.bank_name}
                            </p>
                            {acc.is_default && (
                              <span className="flex items-center gap-1 bg-emerald-50 border border-emerald-100 text-emerald-600 text-[9px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider">
                                <CheckCircle2 className="size-3" /> Padrão
                              </span>
                            )}
                          </div>

                          <p className="text-xs font-medium text-slate-500 truncate">
                            {acc.type === "pix"
                              ? `Chave: ${acc.pix_key}`
                              : `Ag: ${acc.agency} • Cc: ${acc.account_number}`
                            }
                          </p>
                          <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest truncate">
                            Titular: {acc.owner_name}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0 ml-4 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(acc)} disabled={isPending} className="h-9 w-9 text-blue-600 hover:bg-blue-50 rounded-xl">
                          <Pencil className="size-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(acc.id)} disabled={isPending} className="h-9 w-9 text-red-500 hover:bg-red-50 hover:text-red-600 rounded-xl">
                          {isPending ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                        </Button>
                      </div>

                    </div>
                  ))}
                </div>
              )}

            </div>
          )}

          {view === 'form' && (
            <AccountForm
              teacherId={teacherId}
              initialData={selectedAccount}
              onCancel={() => setView('list')}
            />
          )}

        </div>
      </DialogContent>
    </Dialog>
  );
}