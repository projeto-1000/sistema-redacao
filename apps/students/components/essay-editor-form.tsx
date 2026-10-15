"use client";

import { useActionState, useState } from "react";
import { Save, AlertCircle, Coins, ScanText } from "lucide-react";
import { Button } from "@repo/ui/components/button";
import { Checkbox } from "@repo/ui/components/checkbox";
import { Alert, AlertDescription } from "@repo/ui/components/alert";
import { submitEssay, type ActionState } from "@/app/actions/submit-essay";
import { SubmitEssayButton } from "./submit-essay-button";
import { EssayTopicDetail } from "@repo/types";
import { useEssayEditor } from "@/hooks/use-essay-editor";
import { saveDraft } from "@/app/actions/essay-drafts";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { EssayDraft } from "@/types";
import Link from "next/link";
import { EssayTranscriptionDialog } from "./essay-transcription-dialog";

interface EssayEditorFormProps {
  topic: EssayTopicDetail;
  backup: EssayDraft | null;
  preferInitialBackup?: boolean;
  hasAvailableCredits: boolean;
}

export function EssayEditorForm({
  topic,
  backup,
  preferInitialBackup = false,
  hasAvailableCredits,
}: EssayEditorFormProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [pedagogicalUseConsent, setPedagogicalUseConsent] = useState(
    backup?.pedagogical_use_consent ?? false
  );
  const router = useRouter();
  const {
    content: text,
    setContent: setText,
    sourceFileId,
    setSourceFileId,
    clearAutoSave,
    waitForAutoSave,
  } = useEssayEditor(topic.id, backup, !hasAvailableCredits, preferInitialBackup);

  const [state, formAction] = useActionState(async (prevState: ActionState, formData: FormData) => {
    await waitForAutoSave();
    return submitEssay(topic.id, topic.title, topic.axis, prevState, formData);
  }, null);

  const MAX_CHARS = 10000;
  const MIN_CHARS = 100;
  const charCount = text.length;
  const progressPercentage = Math.min((charCount / MAX_CHARS) * 100, 100);

  const isOverLimit = charCount > MAX_CHARS;
  const isTooShort = charCount < MIN_CHARS;
  const progressColor = isOverLimit ? "bg-red-500" : "bg-primary";

  const handleSaveDraft = async () => {
    setIsSaving(true);
    try {
      await waitForAutoSave();

      const result = await saveDraft(
        topic.id,
        text,
        topic.title,
        topic.axis,
        pedagogicalUseConsent,
        sourceFileId,
        backup?.id
      );

      if (result.success) {
        clearAutoSave();
        toast.success("Rascunho salvo com sucesso!", {
          description: "Você pode continuar editando quando quiser.",
        });

        router.push("/minhas-redacoes");
      }
    } catch (error) {
      toast.error("Erro ao salvar rascunho", {
        description: "Tente novamente em instantes.",
      });
      console.error(error);
    }
  };

  return (
    <form suppressHydrationWarning action={formAction} className="flex h-full flex-col gap-4">
      <input type="hidden" name="topicId" value={topic.id} />
      <input type="hidden" name="title" value={topic.title} />
      <input type="hidden" name="thematicAxis" value={topic.axis} />
      <input type="hidden" name="pedagogical_use_consent" value={String(pedagogicalUseConsent)} />
      <input type="hidden" name="source_file_id" value={sourceFileId ?? ""} />

      <div className="flex flex-1 flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-100 bg-slate-50/30 p-5 sm:flex-row sm:items-center">
          <div>
            <h3 className="text-lg font-bold">Folha de Redação</h3>
            <p className="mt-1 text-sm text-slate-500">
              A correção será cobrada apenas quando você concluir o envio.
            </p>
          </div>

          <span className="flex w-fit items-center gap-2 rounded-xl border border-amber-100 bg-amber-50 p-2 text-[11px] font-bold text-amber-800 uppercase">
            <Coins className="size-3.5 text-amber-800" />
            Custo por correção: 1 crédito
          </span>
        </div>

        {!sourceFileId && (
          <div className="mx-5 mt-5 flex flex-col gap-4 rounded-2xl bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="bg-primary/10 text-primary flex size-11 shrink-0 items-center justify-center rounded-xl">
                <ScanText className="size-5" />
              </span>
              <div>
                <p className="text-sm font-bold">Escreveu à mão?</p>
                <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
                  Transforme uma foto ou PDF em texto para revisar.
                </p>
              </div>
            </div>

            <div className="sm:shrink-0">
              <EssayTranscriptionDialog
                topicId={topic.id}
                currentText={text}
                currentSourceFileId={sourceFileId}
                disabled={!hasAvailableCredits}
                onTranscribed={(result) => {
                  setText(result.text);
                  setSourceFileId(result.sourceFileId);
                }}
              />
            </div>
          </div>
        )}

        {state?.error && (
          <div className="animate-in slide-in-from-top-2 mx-6 mt-6 flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 p-3 text-sm font-medium text-red-600">
            <AlertCircle className="size-4 shrink-0" />
            {state.error}
          </div>
        )}

        {!hasAvailableCredits && (
          <Alert className="mx-6 mt-6 w-auto border-amber-200 bg-amber-50 text-amber-950">
            <AlertCircle className="text-amber-700" />
            <AlertDescription className="text-amber-900/90">
              <p>
                Você não tem créditos disponíveis para enviar redações.{" "}
                <Link
                  href="/assinatura/comprar-creditos"
                  className="font-bold underline underline-offset-2 hover:text-amber-950"
                >
                  Adquira mais créditos
                </Link>{" "}
                ou{" "}
                <Link
                  href="/assinatura/planos"
                  className="font-bold underline underline-offset-2 hover:text-amber-950"
                >
                  escolha um plano com mais créditos
                </Link>{" "}
                para continuar.
              </p>
            </AlertDescription>
          </Alert>
        )}

        {sourceFileId && (
          <Alert className="mx-6 mt-6 w-auto border-blue-200 bg-blue-50 text-blue-950">
            <AlertCircle className="text-primary" />
            <AlertDescription className="flex w-full flex-col gap-4 text-blue-950/90 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 space-y-1">
                <strong className="block">Revise a transcrição antes de enviar.</strong>
                <span className="block leading-relaxed">
                  Confira palavras, pontuação e parágrafos comparando com a sua redação manuscrita.
                </span>
              </div>
              <div className="w-full shrink-0 sm:w-auto">
                <EssayTranscriptionDialog
                  topicId={topic.id}
                  currentText={text}
                  currentSourceFileId={sourceFileId}
                  triggerLabel="Enviar nova transcrição"
                  triggerTone="detail"
                  disabled={!hasAvailableCredits}
                  onTranscribed={(result) => {
                    setText(result.text);
                    setSourceFileId(result.sourceFileId);
                  }}
                />
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div className="relative flex flex-1 flex-col p-6">
          <label
            htmlFor="essay-text"
            className="text-xs font-bold tracking-widest text-slate-400 uppercase"
          >
            Seu texto
          </label>

          <textarea
            suppressHydrationWarning
            id="essay-text"
            name="content"
            className="min-h-96 w-full flex-1 resize-y bg-transparent text-base leading-relaxed font-medium text-slate-700 outline-none placeholder:text-slate-300 lg:min-h-128"
            placeholder="Primeiro, escreva sua redação à mão, como no dia da prova. Depois, transcreva-a aqui."
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={!hasAvailableCredits}
            spellCheck={false}
          />

          <div className="mt-4 flex justify-end">
            <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-slate-50 px-4 py-1.5 shadow-sm">
              <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                Caracteres
              </span>
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-bold ${isOverLimit ? "text-red-500" : "text-slate-900"}`}
                >
                  {charCount.toLocaleString("pt-BR")} <span className="text-slate-300">/</span>{" "}
                  {MAX_CHARS.toLocaleString("pt-BR")}
                </span>
                <div className="h-1.5 w-12 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${progressColor}`}
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200 p-5">
          <label className="mb-5 flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-slate-600">
            <Checkbox
              checked={pedagogicalUseConsent}
              disabled={!hasAvailableCredits}
              onCheckedChange={(checked) => setPedagogicalUseConsent(checked === true)}
              aria-describedby="pedagogical-use-consent-description"
              className="mt-0.5"
            />
            <span id="pedagogical-use-consent-description">
              Autorizo o uso anonimizado da minha redação e, quando enviado, do arquivo manuscrito
              no banco de redações exemplares, em aulas e em materiais pedagógicos do Projeto 1000
            </span>
          </label>

          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
            <SubmitEssayButton disabled={!hasAvailableCredits || isOverLimit || isTooShort} />

            <Button
              type="button"
              variant="outline"
              disabled={!hasAvailableCredits || text === "" || isSaving === true}
              onClick={handleSaveDraft}
              className="h-12 w-full gap-2 rounded-full px-6 font-bold sm:w-auto"
              isLoading={isSaving}
              loadingText="Salvando"
            >
              <Save className="size-4" />
              Sair da Tela e Salvar Rascunho
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
