"use client";

import { useMemo, useRef, useState } from "react";
import { Camera, FileText, ScanText, Upload } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@repo/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@repo/ui/components/dialog";
import { Progress } from "@repo/ui/components/progress";
import { createClient } from "@/lib/client";
import {
  ESSAY_SOURCE_ACCEPT,
  ESSAY_SOURCE_BUCKET,
  validateEssaySourceFile,
} from "@/lib/essay-source-files";

type TranscriptionStatus = "idle" | "uploading" | "processing" | "transcribing";

interface EssayTranscriptionDialogProps {
  topicId: string;
  currentText: string;
  currentSourceFileId: string | null;
  disabled?: boolean;
  onTranscribed: (result: { text: string; sourceFileId: string }) => void;
}

const STATUS_DETAILS: Record<
  Exclude<TranscriptionStatus, "idle">,
  { label: string; progress: number }
> = {
  uploading: { label: "Enviando o arquivo com segurança...", progress: 25 },
  processing: { label: "Preparando o arquivo...", progress: 55 },
  transcribing: { label: "Transcrevendo sua redação...", progress: 85 },
};

export function EssayTranscriptionDialog({
  topicId,
  currentText,
  currentSourceFileId,
  disabled = false,
  onTranscribed,
}: EssayTranscriptionDialogProps) {
  const supabase = useMemo(() => createClient(), []);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<TranscriptionStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const isWorking = status !== "idle";

  function selectFile(selectedFile: File | null) {
    if (!selectedFile) return;

    const validationError = validateEssaySourceFile(selectedFile);

    if (validationError) {
      setFile(null);
      setError(validationError);
      return;
    }

    setFile(selectedFile);
    setError(null);
  }

  function handleOpenChange(nextOpen: boolean) {
    if (isWorking) return;

    setIsOpen(nextOpen);

    if (!nextOpen) {
      setFile(null);
      setError(null);
    }
  }

  async function handleTranscription() {
    if (!file || isWorking) return;

    let stagingPath: string | null = null;
    let processedSourceFileId: string | null = null;

    try {
      setError(null);
      setStatus("uploading");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("Sua sessão expirou. Entre novamente para continuar.");
      }

      const extension =
        file.type === "application/pdf" ? "pdf" : file.type === "image/png" ? "png" : "jpg";
      stagingPath = `${user.id}/staging/${crypto.randomUUID()}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from(ESSAY_SOURCE_BUCKET)
        .upload(stagingPath, file, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) throw uploadError;

      setStatus("processing");

      const processResponse = await fetch("/api/essay-source-files/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: stagingPath,
          topicId,
          originalFilename: file.name,
        }),
      });
      const processResult = (await processResponse.json()) as {
        sourceFileId?: string;
        error?: string;
      };

      if (!processResponse.ok || !processResult.sourceFileId) {
        throw new Error(processResult.error ?? "Não foi possível preparar o arquivo.");
      }

      processedSourceFileId = processResult.sourceFileId;
      stagingPath = null;
      setStatus("transcribing");

      const transcriptionResponse = await fetch("/api/essay-source-files/transcribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceFileId: processResult.sourceFileId,
          previousSourceFileId: currentSourceFileId,
        }),
      });
      const transcriptionResult = (await transcriptionResponse.json()) as {
        text?: string;
        error?: string;
      };

      if (!transcriptionResponse.ok || !transcriptionResult.text) {
        throw new Error(transcriptionResult.error ?? "Não foi possível transcrever a redação.");
      }

      onTranscribed({
        text: transcriptionResult.text,
        sourceFileId: processResult.sourceFileId,
      });
      processedSourceFileId = null;
      setIsOpen(false);
      setFile(null);
      toast.success("Transcrição concluída", {
        description: "Revise todo o texto antes de enviar para correção.",
      });
    } catch (transcriptionError) {
      const message =
        transcriptionError instanceof Error
          ? transcriptionError.message
          : "Não foi possível transcrever a redação.";

      setError(message);

      if (processedSourceFileId) {
        try {
          await fetch("/api/essay-source-files/transcribe", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sourceFileId: processedSourceFileId }),
          });
        } catch (cleanupError) {
          console.error("Essay source cleanup error:", cleanupError);
        }
      }
    } finally {
      if (stagingPath) {
        await supabase.storage.from(ESSAY_SOURCE_BUCKET).remove([stagingPath]);
      }

      setStatus("idle");
    }
  }

  const statusDetails = status === "idle" ? null : STATUS_DETAILS[status];

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className="border-primary/25 text-primary hover:bg-primary/5 hover:text-primary h-10 gap-2 rounded-xl px-4 font-bold"
        >
          <ScanText className="size-4" />
          Transcrever redação
        </Button>
      </DialogTrigger>

      <DialogContent className="gap-0 overflow-hidden rounded-3xl p-0 sm:max-w-xl">
        <DialogHeader className="border-b border-slate-100 p-6 pr-14">

          <DialogTitle className="text-xl flex items-center gap-3">
            <div className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-xl">
              <ScanText className="size-5" />
            </div>
            Transcrever redação manuscrita
          </DialogTitle>
          <DialogDescription className="leading-relaxed text-slate-500">
            Envie uma foto ou PDF. A transcrição será inserida na folha de redação para você
            revisar.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 p-6">
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/jpeg,image/png"
            capture="environment"
            className="hidden"
            onChange={(event) => selectFile(event.target.files?.[0] ?? null)}
          />
          <input
            ref={fileInputRef}
            type="file"
            accept={ESSAY_SOURCE_ACCEPT}
            className="hidden"
            onChange={(event) => selectFile(event.target.files?.[0] ?? null)}
          />

          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              disabled={isWorking}
              onClick={() => cameraInputRef.current?.click()}
              className="hover:border-primary/40 hover:bg-primary/5 flex min-h-28 items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-xl">
                <Camera className="size-5" />
              </span>
              <span>
                <strong className="block text-sm">Tirar uma foto</strong>
                <span className="mt-1 block text-xs leading-relaxed text-slate-500">
                  Use a câmera do celular ou tablet
                </span>
              </span>
            </button>

            <button
              type="button"
              disabled={isWorking}
              onClick={() => fileInputRef.current?.click()}
              className="hover:border-primary/40 hover:bg-primary/5 flex min-h-28 items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                <Upload className="size-5" />
              </span>
              <span>
                <strong className="block text-sm">Escolher arquivo</strong>
                <span className="mt-1 block text-xs leading-relaxed text-slate-500">
                  JPG, PNG ou PDF
                </span>
              </span>
            </button>
          </div>

          {file && (
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3.5">
              <FileText className="text-primary size-5 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-slate-800">{file.name}</p>
                <p className="text-xs text-slate-500">
                  {(file.size / 1024 / 1024).toLocaleString("pt-BR", { maximumFractionDigits: 2 })}{" "}
                  MB
                </p>
              </div>
            </div>
          )}

          {currentText.trim() && (
            <p className="rounded-xl bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-900">
              Ao concluir, a transcrição substituirá o texto que está atualmente na folha de
              redação.
            </p>
          )}

          {statusDetails && (
            <div className="bg-primary/5 space-y-2 rounded-2xl p-4">
              <div className="text-primary flex items-center justify-between gap-3 text-sm font-medium">
                <span>{statusDetails.label}</span>
                <span>{statusDetails.progress}%</span>
              </div>
              <Progress value={statusDetails.progress} />
            </div>
          )}

          {error && (
            <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          )}

          <p className="text-xs leading-relaxed text-slate-500">
            Envie apenas uma redação por arquivo. Imagens podem ter até 10 MB; PDFs, até 5 MB.
          </p>
        </div>

        <DialogFooter className="border-t border-slate-100 bg-slate-50/70 p-5 sm:items-center">
          <Button
            type="button"
            variant="outline"
            disabled={isWorking}
            onClick={() => handleOpenChange(false)}
            className="rounded-xl"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            disabled={!file || isWorking}
            onClick={handleTranscription}
            isLoading={isWorking}
            loadingText="Transcrevendo"
            className="rounded-xl font-bold"
          >
            Transcrever redação
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
