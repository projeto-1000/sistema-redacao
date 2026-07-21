import { transactionLabels } from "@repo/constants";
import { CreditTransaction } from "@repo/types";
import { formatCurrency, formatDate } from "@repo/utils";

interface CreditTableRowProps {
  tx: CreditTransaction;
}

interface TransactionDisplay {
  primaryValue: string;
  secondaryValue: string | null;
  valueClassName: string;
}

const CREDIT_GRANT_TYPES: CreditTransaction["type"][] = [
  "plan_renewal",
  "standalone_purchase",
  "new_subscription",
  "free_trial_grant",
  "mentorship_bonus",
  "plan_change"
];

function formatCreditsAmount(
  amount: number,
  options?: {
    showPositiveSign?: boolean;
  }
): string {
  const absoluteAmount = Math.abs(amount);
  const label =
    absoluteAmount === 1 ? "crédito" : "créditos";

  let sign = "";

  if (amount < 0) {
    sign = "-";
  } else if (options?.showPositiveSign) {
    sign = "+";
  }

  return `${sign}${absoluteAmount} ${label}`;
}

function getSecondaryValue(
  tx: CreditTransaction
): string | null {
  const priceInCents = tx.metadata?.price_in_cents;

  if (
    typeof priceInCents !== "number" ||
    priceInCents <= 0
  ) {
    return null;
  }

  return formatCurrency(priceInCents);
}

function getTransactionDisplay(
  tx: CreditTransaction
): TransactionDisplay {
  if (tx.type === "essay_usage") {
    return {
      primaryValue: formatCreditsAmount(tx.amount),
      secondaryValue: null,
      valueClassName:
        "font-semibold text-slate-500",
    };
  }

  if (tx.type === "essay_refund") {
    return {
      primaryValue: formatCreditsAmount(tx.amount, {
        showPositiveSign: true,
      }),
      secondaryValue: null,
      valueClassName:
        "font-bold text-emerald-600",
    };
  }

  if (CREDIT_GRANT_TYPES.includes(tx.type)) {
    return {
      primaryValue: formatCreditsAmount(tx.amount, {
        showPositiveSign: true,
      }),
      secondaryValue: getSecondaryValue(tx),
      valueClassName:
        "font-bold text-emerald-600",
    };
  }

  return {
    primaryValue:
      tx.amount > 0
        ? `+${tx.amount}`
        : String(tx.amount),
    secondaryValue: null,
    valueClassName:
      tx.amount > 0
        ? "font-bold text-emerald-600"
        : "font-bold text-slate-900",
  };
}

export function CreditTableRow({
  tx,
}: CreditTableRowProps) {
  const label = transactionLabels[tx.type] ?? tx.type;

  const date = formatDate(
    tx.created_at,
    "numeric"
  );

  const {
    primaryValue,
    secondaryValue,
    valueClassName,
  } = getTransactionDisplay(tx);

  return (
    <div className="flex items-center justify-between border-b border-slate-100 py-4 last:border-0">
      <div>
        <p className="font-bold text-slate-800">
          {label}
        </p>

        <p className="mt-1 text-[13px] font-medium capitalize text-slate-400">
          {date}
        </p>
      </div>

      <div className="flex flex-col items-end text-right">
        <span className={valueClassName}>
          {primaryValue}
        </span>

        {secondaryValue && (
          <span className="mt-1 text-[12px] font-medium text-slate-600/90">
            {secondaryValue}
          </span>
        )}
      </div>
    </div>
  );
}