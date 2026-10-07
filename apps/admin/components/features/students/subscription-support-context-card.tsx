import type { SubscriptionSupportContext } from "@repo/types";
import { Card, CardContent } from "@repo/ui/components/card";
import { Skeleton } from "@repo/ui/components/skeleton";
import { Badge } from "@repo/ui/components/badge";
import { CalendarDays, UserRound } from "lucide-react";
import { formatDate } from "@repo/utils";

export function SubscriptionSupportContextCard({
  context,
}: {
  context: SubscriptionSupportContext | null;
}) {
  return (
    <Card className="shrink-0 gap-0 overflow-hidden border-slate-200 bg-white py-0 shadow-none">
      <CardContent className="p-4">
        {context ? (
          <>
            <div className="flex items-start gap-3">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <UserRound className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-slate-800">{context.name}</p>
                <p className="text-xs break-all text-slate-500">{context.email}</p>
              </div>
              <Badge variant="secondary" className="max-w-[45%] shrink-0 whitespace-normal bg-blue-50 text-blue-700">
                {context.planName} · {context.planPeriodLabel}
              </Badge>
            </div>
            <div className="mt-4 grid grid-cols-3 divide-x divide-slate-200 rounded-lg bg-slate-50 py-3 text-center">
              {[
                { label: "Disponibilizados", value: context.grantedCredits },
                { label: "Utilizados", value: context.usedCredits },
                { label: "Disponíveis", value: context.availableCredits },
              ].map((item) => (
                <div key={item.label} className="px-1">
                  <p className="text-lg font-bold text-slate-800 tabular-nums">
                    {item.value ?? "—"}
                  </p>
                  <p className="text-[10px] font-medium text-slate-500 sm:text-xs">{item.label}</p>
                </div>
              ))}
            </div>
            <p className="mt-3 flex items-center gap-2 text-xs text-slate-500">
              <CalendarDays className="size-4 shrink-0" />
              Último dia do período pago: {formatDate(context.periodEnd, "numeric")}
            </p>
          </>
        ) : (
          <div role="status" aria-label="Carregando dados do atendimento" className="space-y-4">
            <div className="flex gap-3">
              <Skeleton className="size-11 rounded-xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-4/5" />
              </div>
            </div>
            <Skeleton className="h-16 w-full rounded-lg" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
