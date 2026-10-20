"use client";

import { useRef, useState, useSyncExternalStore, type DragEvent } from "react";
import { Camera, CheckCircle2, FileText, Loader2, ScanText, Upload } from "lucide-react";
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
import { ESSAY_SOURCE_ACCEPT, validateEssaySourceFile } from "@/lib/essay-source-files";

type TranscriptionStatus = "idle" | "uploading" | "processing" | "transcribing";

interface EssayTranscriptionDialogProps {
  topicId: string;
  currentText: string;
  currentSourceFileId: string | null;
  triggerLabel?: string;
  triggerTone?: "primary" | "detail";
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

const TOUCH_POINTER_QUERY = "(any-pointer: coarse)";

function subscribeToTouchCapability(onChange: () => void) {
  const mediaQuery = window.matchMedia(TOUCH_POINTER_QUERY);

  mediaQuery.addEventListener("change", onChange);
  return () => mediaQuery.removeEventListener("change", onChange);
}

function isAppleMobileDevice() {
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.userAgent.includes("Macintosh") && navigator.maxTouchPoints > 1)
  );
}

function getTouchCapabilitySnapshot() {
  const hasTouchInput =
    window.matchMedia(TOUCH_POINTER_QUERY).matches || navigator.maxTouchPoints > 0;

  return hasTouchInput && !isAppleMobileDevice();
}

function getServerTouchCapabilitySnapshot() {
  return false;
}

export function EssayTranscriptionDialog({
  topicId,
  currentText,
  currentSourceFileId,
  triggerLabel = "Enviar para transcrição",
  triggerTone = "primary",
  disabled = false,
  onTranscribed,
}: EssayTranscriptionDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<TranscriptionStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const canCapturePhoto = useSyncExternalStore(
    subscribeToTouchCapability,
    getTouchCapabilitySnapshot,
    getServerTouchCapabilitySnapshot
  );
  const isWorking = status !== "idle";

  function selectFile(selectedFile: File | null) {
    if (!selectedFile) return;

    setIsDraggingFile(false);

    const validationError = validateEssaySourceFile(selectedFile);

    if (validationError) {
      setFile(null);
      setError(validationError);
      return;
    }

    setFile(selectedFile);
    setError(null);
  }

  function handleFileDrag(event: DragEvent<HTMLButtonElement>) {
    event.preventDefault();

    if (!isWorking) {
      setIsDraggingFile(true);
    }
  }

  function handleFileDragLeave(event: DragEvent<HTMLButtonElement>) {
    event.preventDefault();

    const nextTarget = event.relatedTarget;

    if (nextTarget instanceof Node && event.currentTarget.contains(nextTarget)) return;

    setIsDraggingFile(false);
  }

  function handleFileDrop(event: DragEvent<HTMLButtonElement>) {
    event.preventDefault();
    setIsDraggingFile(false);

    if (isWorking) return;

    if (event.dataTransfer.files.length !== 1) {
      setFile(null);
      setError("Envie apenas um arquivo por vez.");
      return;
    }

    selectFile(event.dataTransfer.files[0] ?? null);
  }

  function handleOpenChange(nextOpen: boolean) {
    if (isWorking) return;

    setIsOpen(nextOpen);

    if (!nextOpen) {
      setFile(null);
      setError(null);
      setIsDraggingFile(false);
    }
  }

  async function handleTranscription() {
    if (!file || isWorking) return;

    let stagingPath: string | null = null;
    try {
      setError(null);
      setStatus("uploading");

      const uploadUrlResponse = await fetch("/api/essay-source-files/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentType: file.type }),
      });
      const uploadUrlResult = (await uploadUrlResponse.json()) as {
        path?: string;
        uploadUrl?: string;
        error?: string;
      };

      if (!uploadUrlResponse.ok || !uploadUrlResult.path || !uploadUrlResult.uploadUrl) {
        throw new Error(uploadUrlResult.error ?? "Não foi possível preparar o envio do arquivo.");
      }

      stagingPath = uploadUrlResult.path;

      const uploadResponse = await fetch(uploadUrlResult.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!uploadResponse.ok) {
        throw new Error("Não foi possível enviar o arquivo.");
      }

      setStatus("processing");
      setStatus("transcribing");

      const transcriptionResponse = await fetch("/api/essay-source-files/transcribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: stagingPath,
          topicId,
          originalFilename: file.name,
          previousSourceFileId: currentSourceFileId,
        }),
      });
      const transcriptionResult = (await transcriptionResponse.json()) as {
        text?: string;
        sourceFileId?: string;
        error?: string;
      };

      if (
        !transcriptionResponse.ok ||
        !transcriptionResult.text ||
        !transcriptionResult.sourceFileId
      ) {
        throw new Error(transcriptionResult.error ?? "Não foi possível transcrever a redação.");
      }

      onTranscribed({
        text: transcriptionResult.text,
        sourceFileId: transcriptionResult.sourceFileId,
      });
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
    } finally {
      if (stagingPath) {
        try {
          await fetch("/api/essay-source-files/upload-url", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ path: stagingPath }),
          });
        } catch (cleanupError) {
          console.error("Temporary essay source cleanup error:", cleanupError);
        }
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
          variant={triggerTone === "detail" ? "ghost" : "default"}
          disabled={disabled}
          className={`h-11 w-full gap-2 rounded-xl px-5 font-bold sm:w-auto ${
            triggerTone === "detail"
              ? "h-auto rounded-none bg-transparent text-blue-900 shadow-none hover:bg-transparent hover:text-blue-700"
              : "shadow-sm"
          }`}
        >
          <ScanText className="size-4" />
          <span>{triggerLabel}</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="flex max-h-[calc(100dvh-1rem)] flex-col gap-0 overflow-hidden rounded-3xl p-0 sm:max-h-[calc(100dvh-2rem)] sm:max-w-xl">
        <DialogHeader className="shrink-0 border-b border-slate-100 px-6 py-4 pr-14">
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="text-primary flex size-10 items-center justify-center rounded-xl bg-[#fdf9ea]">
              <ScanText className="size-6" />
            </div>
            Digitalizar sua redação
          </DialogTitle>
          <DialogDescription className="text-left leading-relaxed text-slate-500">
            Vamos transformar seu manuscrito em texto editável para você revisar.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain p-4 sm:p-6">
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

          <div className={`grid gap-3 ${canCapturePhoto ? "sm:grid-cols-2" : "grid-cols-1"}`}>
            {canCapturePhoto && (
              <button
                type="button"
                disabled={isWorking}
                onClick={() => cameraInputRef.current?.click()}
                className="hover:border-primary/60 hover:bg-primary/5 flex min-h-44 flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-slate-200 bg-white p-4 text-center transition-colors hover:border-solid disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#FFF9E6] text-yellow-600">
                  <Camera className="size-5" />
                </span>
                <span>
                  <strong className="block text-sm">Tirar uma foto</strong>
                  <span className="mt-1 block text-sm leading-relaxed text-slate-600">
                    Use a câmera do dispositivo
                  </span>
                </span>
              </button>
            )}

            <button
              type="button"
              disabled={isWorking}
              onClick={() => fileInputRef.current?.click()}
              onDragEnter={handleFileDrag}
              onDragOver={handleFileDrag}
              onDragLeave={handleFileDragLeave}
              onDrop={handleFileDrop}
              className={`hover:border-primary/60 hover:bg-primary/5 flex min-h-44 flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-slate-200 bg-white p-4 text-center transition-colors hover:border-solid disabled:cursor-not-allowed disabled:opacity-60 ${isDraggingFile ? "border-primary bg-primary/15 border-dashed" : ""} `}
            >
              <span
                className={`flex shrink-0 items-center justify-center bg-[#FFF9E6] text-yellow-600 ${
                  canCapturePhoto ? "size-11 rounded-xl" : "size-12 rounded-2xl"
                }`}
              >
                <Upload className="size-5" />
              </span>
              <span className={canCapturePhoto ? "" : "flex flex-col items-center"}>
                <strong className="block text-sm">
                  {isDraggingFile
                    ? "Solte o arquivo para enviar"
                    : canCapturePhoto
                      ? "Escolher arquivo"
                      : "Arraste e solte o arquivo aqui"}
                </strong>

                {!canCapturePhoto && !isDraggingFile && (
                  <span className="bg-primary mt-3 mb-2 rounded-xl px-4 py-2 text-sm font-bold shadow-sm">
                    Escolher arquivo
                  </span>
                )}
                <span className="mt-1 block text-sm leading-relaxed text-slate-600">
                  JPG, PNG ou PDF · até 10 MB
                </span>
              </span>
            </button>
          </div>

          <div className="rounded-2xl border border-slate-300 bg-slate-100 p-4">
            <div className="flex items-center gap-2 text-base font-bold">
              <CheckCircle2 className="size-5 text-amber-400" />
              Checklist para uma boa transcrição
            </div>
            <ul className="mt-3 space-y-1.5 pl-7 text-sm leading-6 text-slate-600">
              <li className="list-disc">Enquadre toda a folha, sem cortar as margens.</li>
              <li className="list-disc">Evite sombras, reflexos e fotos inclinadas.</li>
              <li className="list-disc">Envie apenas um arquivo JPG, PNG ou PDF de até 10 MB.</li>
            </ul>
          </div>

          {file && (
            <div
              className={`rounded-2xl border p-3.5 transition-colors ${
                statusDetails ? "border-primary/30 bg-primary/5" : "border-slate-200 bg-slate-50"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
                  {statusDetails ? (
                    <Loader2 className="text-primary size-5 animate-spin" />
                  ) : (
                    <FileText className="text-primary size-5" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-slate-800">{file.name}</p>
                  <p className="mt-0.5 text-xs text-slate-600">
                    {statusDetails
                      ? statusDetails.label
                      : `${(file.size / 1024 / 1024).toLocaleString("pt-BR", {
                          maximumFractionDigits: 2,
                        })} MB`}
                  </p>
                </div>
                {statusDetails && (
                  <span className="text-primary shrink-0 text-xs font-bold">
                    {statusDetails.progress}%
                  </span>
                )}
              </div>
              {statusDetails && (
                <Progress value={statusDetails.progress} className="bg-primary/15 mt-3 h-1.5" />
              )}
            </div>
          )}

          {currentText.trim() && (
            <p className="rounded-xl bg-[#FFF9E6] px-4 py-3 text-xs leading-relaxed text-[#6F6019]">
              Ao concluir, a transcrição substituirá o texto que está atualmente na folha de
              redação.
            </p>
          )}

          {error && (
            <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          )}
        </div>

        <DialogFooter className="flex flex-row justify-end gap-2 border-t border-slate-100 bg-slate-50/70 p-4 sm:flex-row sm:items-center">
          <Button
            type="button"
            variant="outline"
            disabled={isWorking}
            onClick={() => handleOpenChange(false)}
            className="h-11 w-1/2 rounded-xl md:w-auto"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            disabled={!file || isWorking}
            onClick={handleTranscription}
            className="h-11 w-1/2 rounded-xl md:w-auto"
          >
            Transcrever redação
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
