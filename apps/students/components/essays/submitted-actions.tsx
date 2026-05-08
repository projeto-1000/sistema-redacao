import { EssayStatus } from "@repo/types";
import { Button } from "@repo/ui/components/button";
import Link from "next/link";

const statusConfig: Record<Exclude<EssayStatus, "draft">, { label: string; disabled: boolean }> = {
  pending: { label: "Aguardando Correção", disabled: true },
  correcting: { label: "Em Correção", disabled: true },
  corrected: { label: "Ver Correção", disabled: false },
  returned: { label: "Ver Detalhes", disabled: false },
};

interface SubmittedActionsProps {
  status: Exclude<EssayStatus, "draft">;
  essayId: string
}

export function SubmittedActions({ status, essayId }: SubmittedActionsProps) {
  const action = statusConfig[status];

  if (action.disabled) {
    return (
      <Button
        variant="ghost"
        disabled
        className="w-full bg-accent/50 text-secondary/60 font-bold rounded-xl h-10 cursor-not-allowed"
      >
        {action.label}
      </Button>
    );
  }

  return (
    <Button
      asChild
      variant="ghost"
      className="w-full bg-accent text-secondary hover:bg-accent/80 font-bold rounded-xl h-10"
    >
      <Link href={`/minhas-redacoes/${essayId}`}>
        {action.label}
      </Link>
    </Button>
  );
}