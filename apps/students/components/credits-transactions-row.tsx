import { transactionLabels } from "@repo/constants";
import { CreditTransaction } from "@repo/types";
import { formatDate, formatCurrency } from "@repo/utils";

interface CreditTableRowProps {
  tx: CreditTransaction;
}

export function CreditTableRow({ tx }: CreditTableRowProps) {
  const label = transactionLabels[tx.type];

  const date = formatDate(tx.created_at, 'numeric');

  let primaryValue = '';
  let secondaryValue: string | null = null;
  let valueColor = 'text-slate-900';

  if (tx.type === 'essay_usage') {
    primaryValue = `${tx.amount} crédito`;
    valueColor = 'text-slate-500 font-semibold';
  }
  else if (tx.type === 'mentorship_bonus') {
    primaryValue = `+${tx.amount} créditos`;
    valueColor = 'text-emerald-600 font-bold';
  }
  else if (['plan_renewal', 'standalone_purchase', 'new_subscription'].includes(tx.type)) {
    primaryValue = `+${tx.amount} créditos`;
    valueColor = 'text-emerald-600 font-bold';

    const priceInCents = tx.metadata?.price_in_cents;
    if (priceInCents && priceInCents > 0) {
      secondaryValue = formatCurrency(priceInCents);
    }
  }

  else {
    primaryValue = tx.amount > 0 ? `+${tx.amount}` : `${tx.amount}`;
    valueColor = tx.amount > 0 ? 'text-emerald-600 font-bold' : 'text-slate-900 font-bold';
  }

  return (
    <div className="flex justify-between items-center py-4 border-b border-slate-100 last:border-0">
      <div>
        <p className="font-bold text-slate-800">{label}</p>
        <p className="text-[13px] font-medium text-slate-400 mt-1 capitalize">
          {date}
        </p>
      </div>

      <div className="text-right flex flex-col items-end">
        <span className={valueColor}>
          {primaryValue}
        </span>

        {secondaryValue && (
          <span className="text-[12px] font-medium text-slate-600/90 mt-1">
            {secondaryValue}
          </span>
        )}
      </div>
    </div>
  );
}