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
import { queuePostRedirectSuccessToast } from "@repo/ui/components/post-redirect-toast";
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

    let redirectStarted = false;

    submittingRef.current = true;
    setIsSubmitting(true);

    try {
      const result = await approveSupervisedCorrection(submissionId);

      if (!result.success) {
        toast.error(result.error ?? "Não foi possível aprovar a correção.");
        return;
      }

      const destinationPath = "/redacoes-pendentes?tab=revisoes";

      queuePostRedirectSuccessToast(
        "Correção aprovada e enviada ao aluno.",
        destinationPath
      );
      redirectStarted = true;
      router.push(destinationPath);
    } catch (error) {
      console.error("Erro ao aprovar correção supervisionada:", error);
      toast.error("Não foi possível aprovar a correção. Tente novamente.");
    } finally {
      if (!redirectStarted) {
        submittingRef.current = false;
        setIsSubmitting(false);
      }
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
