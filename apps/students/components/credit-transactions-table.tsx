import { History } from "lucide-react";
import { TablePagination } from "./table-pagination";
import { CreditTransaction } from "@repo/types";
import { PostgrestError } from "@supabase/supabase-js";
import { CreditTableRow } from "./credits-transactions-row";

interface CreditsHistoryListProps {
  data: {
    transactions: CreditTransaction[];
    totalPages: number,
    error: PostgrestError | null
  }
}

export default function CreditTransactionsTable({ data }: CreditsHistoryListProps) {

  const { transactions, totalPages, error } = data

  //TODO: colocar o filtro 

  return (
    <>
      <div className="bg-white border border-slate-200 rounded-4xl p-6 md:p-8 shadow-sm overflow-hidden space-y-8">
        <div className="flex items-center gap-4">
          <div className="size-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <History className="size-5" />
          </div>
          <div>
            <h2 className="text-xl font-black">Histórico de créditos</h2>
            <p className="text-sm font-medium text-slate-500">
              Extrato completo de envios, compras avulsas e movimentações da assinatura.
            </p>


          </div>
        </div>

        <div className="flex flex-col divide-y divide-slate-100">
          {transactions.map((tx) => (
            <CreditTableRow key={tx.id} tx={tx} />
          ))}
        </div>

      </div>
      <TablePagination totalPages={totalPages} />
    </>
  )
}