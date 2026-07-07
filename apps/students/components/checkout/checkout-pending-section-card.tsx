import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/card";
import type { LucideIcon } from "lucide-react";

interface CheckoutPendingSectionCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export function CheckoutPendingSectionCard({
  icon: Icon,
  title,
  description,
}: CheckoutPendingSectionCardProps) {
  return (
    <Card className="rounded-3xl border-slate-100 bg-white shadow-sm">
      <CardHeader className="gap-4 sm:flex sm:flex-row sm:items-start">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
          <Icon className="size-5" />
        </div>

        <div className="space-y-1">
          <CardTitle className="text-xl font-extrabold tracking-tight">
            {title}
          </CardTitle>

          <CardDescription className="font-medium leading-relaxed">
            {description}
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent>
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6">
          <p className="text-sm font-semibold text-slate-500">
            Esta etapa será preenchida na próxima implementação.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}