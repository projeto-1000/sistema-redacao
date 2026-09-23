import { CheckCircle2, Landmark, Plus } from "lucide-react";
import type { TeacherPaymentAccount } from "@repo/types";
import { maskPaymentAccountNumber, maskPaymentPixKey } from "@repo/utils";
import { Button } from "@repo/ui/components/button";

interface PaymentAccountsListProps {
  accounts: TeacherPaymentAccount[];
  createAction?: React.ReactNode;
  renderActions?: (account: TeacherPaymentAccount) => React.ReactNode;
}

export function PaymentAccountsList({ accounts, createAction, renderActions }: PaymentAccountsListProps) {
  return (
    <section className="rounded-4xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900">Contas de recebimento</h2>
          <p className="mt-1 text-sm font-medium text-slate-500">
            Cadastre os dados que serão usados nos próximos pagamentos.
          </p>
        </div>
        {createAction}
      </div>

      {accounts.length === 0 ? (
        <div className="flex flex-col items-center rounded-3xl border-2 border-dashed border-slate-200 px-6 py-14 text-center">
          <span className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <Landmark className="size-6" />
          </span>
          <p className="font-bold text-slate-800">Nenhuma conta cadastrada</p>
          <p className="mt-1 max-w-sm text-sm font-medium text-slate-500">
            Adicione uma chave PIX ou conta bancária para receber os próximos pagamentos.
          </p>
          {!createAction && (
            <Button className="mt-5 rounded-xl font-bold">
              <Plus className="size-4" /> Adicionar conta
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {accounts.map((account) => (
            <div
              key={account.id}
              className="flex flex-col gap-4 rounded-2xl border border-slate-200 p-4 transition-colors hover:border-blue-200 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex min-w-0 items-center gap-4">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                  <Landmark className="size-5" />
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-bold text-slate-900">
                      {account.type === "pix" ? `PIX • ${account.pix_type?.toUpperCase()}` : `${account.bank_name} • Conta ${account.account_variant}`}
                    </p>
                    {account.is_default && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-black uppercase text-emerald-700">
                        <CheckCircle2 className="size-3" /> Principal
                      </span>
                    )}
                  </div>
                  <p className="mt-1 truncate text-sm font-medium text-slate-500">
                    {account.type === "pix"
                      ? maskPaymentPixKey(account.pix_key, account.pix_type)
                      : `Agência ${account.agency} • Conta ${maskPaymentAccountNumber(account.account_number)}`}
                  </p>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Titular: {account.owner_name}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 justify-end gap-2">
                {renderActions?.(account)}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 rounded-2xl border border-amber-100 bg-amber-50 p-4 text-sm font-medium text-amber-900">
        Os dados ficam visíveis apenas para o professor e para a equipe responsável pelos pagamentos. Alterações não modificam pagamentos já realizados.
      </div>
    </section>
  );
}
