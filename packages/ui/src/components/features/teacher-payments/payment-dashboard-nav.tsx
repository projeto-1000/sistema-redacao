import Link from "next/link";
import { cn } from "@repo/ui/lib/utils";

export type TeacherPaymentsTab = "overview" | "accounts" | "history";

interface PaymentDashboardNavProps {
  activeTab: TeacherPaymentsTab;
  baseHref: string;
}

const tabs: Array<{ value: TeacherPaymentsTab; label: string }> = [
  { value: "overview", label: "Visão geral" },
  { value: "accounts", label: "Contas" },
  { value: "history", label: "Histórico" },
];

export function PaymentDashboardNav({ activeTab, baseHref }: PaymentDashboardNavProps) {
  const separator = baseHref.includes("?") ? "&" : "?";
  return (
    <nav
      aria-label="Seções de pagamentos"
      className="inline-flex w-full max-w-xl rounded-2xl border border-slate-200 bg-slate-100 p-1"
    >
      {tabs.map((tab) => (
        <Link
          key={tab.value}
          href={tab.value === "overview" ? baseHref : `${baseHref}${separator}tab=${tab.value}`}
          aria-current={activeTab === tab.value ? "page" : undefined}
          className={cn(
            "flex-1 rounded-xl px-4 py-3 text-center text-sm font-bold transition-colors",
            activeTab === tab.value
              ? "bg-blue-600 text-white shadow-sm"
              : "text-slate-600 hover:bg-white hover:text-slate-900",
          )}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
