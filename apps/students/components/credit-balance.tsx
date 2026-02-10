import { DollarSign } from "lucide-react";

interface CreditBalanceProps {
  amount: number;
}

export function CreditBalance({ amount }: CreditBalanceProps) {
  return (
    <div className="flex items-center gap-3 border border-slate-200 px-5 h-14 rounded-full shadow-sm w-full sm:w-auto bg-white ">
      <div className="flex items-center justify-center size-8 bg-primary/10 rounded-full text-primary">
        <DollarSign className="size-4 text-primary" />
      </div>
      <div className="flex flex-col">
        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-none">
          Seu Saldo
        </span>
        <span className="text-sm font-bold">
          Créditos: <span className="text-primary">{amount} disponíveis</span>
        </span>
      </div>
    </div>
  );
}