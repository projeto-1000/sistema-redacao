import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogFooter, AlertDialogCancel, AlertDialogAction, AlertDialogHeader, AlertDialogDescription, AlertDialogTitle } from "@repo/ui/components/alert-dialog";
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
    <div className="flex gap-2 w-full">
      <Button
        asChild
        className="flex-1 bg-amber-100 text-amber-700 hover:bg-amber-200 font-bold rounded-xl h-10 gap-2"
      >
        <Link href={`/minhas-redacoes/nova-redacao?id=${topicId}`}>
          Continuar Redação <ArrowRight className="size-4" />
        </Link>
      </Button>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button className="h-10 bg-red-100 shrink-0 hover:bg-red-200 transition-colors rounded-lg">
            <Trash2 className="size-4 text-red-600" />
          </Button>
        </AlertDialogTrigger>

        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir rascunho?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Você perderá todo o progresso feito nesta redação até agora.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl font-bold">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={onConfirmDelete}
              disabled={isPending}
              className="bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold"
            >
              {isPending ? "Excluindo..." : "Sim, excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}