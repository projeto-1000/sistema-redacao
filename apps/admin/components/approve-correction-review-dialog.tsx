"use client";

import { approveSupervisedCorrection } from "@/app/actions/correction-reviews";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@repo/ui/components/alert-dialog";
import { Button } from "@repo/ui/components/button";
import { CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";

interface ApproveCorrectionReviewDialogProps {
  submissionId: string;
}

export function ApproveCorrectionReviewDialog({
  submissionId,
}: ApproveCorrectionReviewDialogProps) {
  const router = useRouter();
  const submittingRef = useRef(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleApprove = async () => {
    if (submittingRef.current) return;

    submittingRef.current = true;
    setIsSubmitting(true);

    try {
      const result = await approveSupervisedCorrection(submissionId);

      if (!result.success) {
        toast.error(result.error ?? "Não foi possível aprovar a correção.");
        return;
      }

      // toast.success("Correção aprovada e enviada ao aluno.");
      // setIsOpen(false);
      // router.push("/redacoes-pendentes?tab=revisoes");
      // router.refresh();
      setIsOpen(false);
      router.push("/redacoes-pendentes?tab=revisoes");
      setTimeout(() => {
        toast.success("Correção aprovada e enviada ao aluno.");
      }, 300);
    } catch (error) {
      console.error("Erro ao aprovar correção supervisionada:", error);
      toast.error("Não foi possível aprovar a correção. Tente novamente.");
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <AlertDialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!isSubmitting) setIsOpen(open);
      }}
    >
      <AlertDialogTrigger asChild>
        <Button className="h-11 rounded-xl font-bold">
          <CheckCircle2 className="size-4" />
          Aprovar correção
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent className="rounded-3xl">
        <AlertDialogHeader>
          <AlertDialogTitle>Aprovar correção?</AlertDialogTitle>
          <AlertDialogDescription>
            Após a aprovação, esta correção será enviada ao aluno. Deseja continuar?
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSubmitting} className="rounded-xl">
            Cancelar
          </AlertDialogCancel>
          <Button
            type="button"
            onClick={handleApprove}
            disabled={isSubmitting}
            isLoading={isSubmitting}
            loadingText="Aprovando..."
            className="rounded-xl font-bold"
          >
            Aprovar correção
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
