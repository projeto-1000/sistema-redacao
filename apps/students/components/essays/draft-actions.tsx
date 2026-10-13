import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
  AlertDialogHeader,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@repo/ui/components/alert-dialog";
import { Button } from "@repo/ui/components/button";
import { ArrowRight, Trash2 } from "lucide-react";
import Link from "next/link";

interface DraftActionsProps {
  topicId: string;
  isPending: boolean;
  onConfirmDelete: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

export function DraftActions({ topicId, isPending, onConfirmDelete }: DraftActionsProps) {
  return (
    <div className="flex w-full min-w-0 gap-2">
      <Button
        asChild
        className="h-10 min-w-0 flex-1 gap-2 rounded-xl bg-amber-100 px-3 font-bold text-amber-700 hover:bg-amber-200 has-[>svg]:px-3 sm:px-4 sm:has-[>svg]:px-4"
      >
        <Link href={`/minhas-redacoes/nova-redacao?id=${topicId}`}>
          Continuar Redação <ArrowRight className="size-4" />
        </Link>
      </Button>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button className="h-10 shrink-0 rounded-lg bg-red-100 transition-colors hover:bg-red-200">
            <Trash2 className="size-4 text-red-600" />
          </Button>
        </AlertDialogTrigger>

        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir rascunho?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Você perderá todo o progresso feito nesta redação até
              agora.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl font-bold">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={onConfirmDelete}
              disabled={isPending}
              className="rounded-xl bg-red-600 font-bold text-white hover:bg-red-700"
            >
              {isPending ? "Excluindo..." : "Sim, excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
