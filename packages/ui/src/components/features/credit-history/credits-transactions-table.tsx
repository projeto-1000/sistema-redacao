import { History } from "lucide-react";
import { CreditTransaction } from "@repo/types";
import { CreditTableRow } from "./credits-transactions-row";
import { TablePagination } from "../../table-pagination";


// Tipagem genérica para o erro, mantendo o pacote UI agnóstico ao backend
interface GenericError {
  message: string;
  [key: string]: any;
}

interface CreditsHistoryListProps {
  data: {
    transactions: CreditTransaction[];
    totalPages: number;
    error: GenericError | Error | null;
  };
}

export default function CreditTransactionsTable({ data }: CreditsHistoryListProps) {
  const { transactions, totalPages, error } = data;

  if (error) {
    return (
      <div className="bg-red-50 text-red-600 border border-red-100 rounded-4xl p-6 md:p-8 shadow-sm">
        <h3 className="font-bold">Não foi possível carregar o histórico</h3>
        <p className="text-sm mt-1">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-4xl shadow-sm overflow-hidden space-y-8">

      <div className="space-y-4 pt-6 md:pt-8">
        <div className="flex items-center gap-4 px-6 md:px-8">
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

        <div className="flex flex-col divide-y divide-slate-100 px-6 md:px-8">
          {transactions.map((tx) => (
            <CreditTableRow key={tx.id} tx={tx} />
          ))}
        </div>
      </div>

      {totalPages > 0 && (
        <div className="py-4 border-t border-slate-100 bg-slate-50">
          <TablePagination totalPages={totalPages} />
        </div>
      )}
    </div>
  );
}