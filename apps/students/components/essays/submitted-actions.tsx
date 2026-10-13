import { EssayStatus } from "@repo/types";
import { Button } from "@repo/ui/components/button";
import { Clock3 } from "lucide-react";
import Link from "next/link";

const statusConfig: Record<Exclude<EssayStatus, "draft">, { label: string; disabled: boolean }> = {
  pending: { label: "Aguardando Correção", disabled: true },
  correcting: { label: "Em Correção", disabled: true },
  corrected: { label: "Ver Correção", disabled: false },
  returned: { label: "Ver Detalhes", disabled: false },
};

interface SubmittedActionsProps {
  status: Exclude<EssayStatus, "draft">;
  essayId: string;
}

export function SubmittedActions({ status, essayId }: SubmittedActionsProps) {
  const action = statusConfig[status];

  if (status === "pending") {
    return (
      <div className="bg-accent/50 text-secondary/70 flex h-10 w-full items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold">
        <Clock3 className="size-4 shrink-0" aria-hidden="true" />
        <span>Aguardando correção</span>
      </div>
    );
  }

  if (action.disabled) {
    return (
      <Button
        variant="ghost"
        disabled
        className="bg-accent/50 text-secondary/60 h-10 w-full cursor-not-allowed rounded-xl font-bold"
      >
        {action.label}
      </Button>
    );
  }

  return (
    <Button
      asChild
      variant="ghost"
      className="bg-accent text-secondary hover:bg-accent/80 h-10 w-full rounded-xl font-bold"
    >
      <Link href={`/minhas-redacoes/${essayId}`}>{action.label}</Link>
    </Button>
  );
}
