"use client";

import { returnSupervisedCorrectionToTeacher } from "@/app/actions/correction-reviews";
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
import { Textarea } from "@repo/ui/components/textarea";
import { RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";

interface ReturnCorrectionReviewDialogProps {
  submissionId: string;
}

export function ReturnCorrectionReviewDialog({
  submissionId,
}: ReturnCorrectionReviewDialogProps) {
  const router = useRouter();
  const submittingRef = useRef(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState("");

  const handleReturn = async () => {
    if (submittingRef.current) return;

    const normalizedFeedback = feedback.trim();

    if (!normalizedFeedback) {
      toast.error("Informe ao professor o que precisa ser ajustado.");
      return;
    }

    let redirectStarted = false;

    submittingRef.current = true;
    setIsSubmitting(true);

    try {
      const result = await returnSupervisedCorrectionToTeacher(
        submissionId,
        normalizedFeedback
      );

      if (!result.success) {
        toast.error(result.error ?? "Não foi possível devolver a correção ao professor.");
        return;
      }

      const destinationPath = "/redacoes-pendentes?tab=revisoes";

      queuePostRedirectSuccessToast(
        "Correção devolvida ao professor para ajustes.",
        destinationPath
      );
      redirectStarted = true;
      router.push(destinationPath);
    } catch (error) {
      console.error("Erro ao devolver correção supervisionada ao professor:", error);
      toast.error("Não foi possível devolver a correção ao professor.");
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
        <Button
          type="button"
          variant="ghost"
          className="h-11 rounded-xl font-bold text-red-700! hover:bg-red-50! transform transition duration-200"
        >
          <RotateCcw className="size-4" />
          Devolver
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent className="rounded-3xl">
        <AlertDialogHeader>
          <AlertDialogTitle>Devolver correção ao professor?</AlertDialogTitle>
          <AlertDialogDescription>
            Explique o que deve ser ajustado. A correção não será publicada para o aluno.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-2">
          <label htmlFor="correction-return-feedback" className="text-sm font-bold text-slate-700">
            Orientações para o professor
          </label>
          <Textarea
            id="correction-return-feedback"
            value={feedback}
            onChange={(event) => setFeedback(event.target.value)}
            disabled={isSubmitting}
            rows={5}
            className="w-full min-h-20 resize-none rounded-xl border border-slate-200 bg-white p-3 text-sm outline-none mt-2"
            placeholder="Descreva os ajustes necessários..."
          />
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSubmitting} className="rounded-xl">
            Cancelar
          </AlertDialogCancel>
          <Button
            type="button"
            variant="destructive"
            onClick={handleReturn}
            disabled={isSubmitting || !feedback.trim()}
            isLoading={isSubmitting}
            loadingText="Devolvendo..."
            className="rounded-xl font-bold"
          >
            Devolver ao professor
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
