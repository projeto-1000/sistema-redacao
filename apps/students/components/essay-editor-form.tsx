"use client";

import { useActionState, useState } from "react";
import { Save, AlertCircle } from "lucide-react";
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
  const [bestEssayConsent, setBestEssayConsent] = useState(backup?.best_essay_consent ?? false);
  const router = useRouter();
  const {
    content: text,
    setContent: setText,
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
        bestEssayConsent,
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
      <input type="hidden" name="best_essay_consent" value={String(bestEssayConsent)} />

      <div className="flex flex-1 flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-row justify-between gap-4 border-b border-slate-100 bg-slate-50/30 p-5 md:items-center">
          <h3 className="text-lg font-bold md:mb-1">Folha de Redação</h3>

          <span className="flex items-center rounded-md bg-[#EBC84C]/20 px-2 text-[8px] font-bold tracking-wider text-[#8B781F] uppercase md:py-1 md:text-[10px]">
            Custa 1 crédito
          </span>
        </div>

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
            className="w-full flex-1 resize-y bg-transparent text-base leading-relaxed font-medium text-slate-700 outline-none placeholder:text-slate-300"
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
              checked={bestEssayConsent}
              disabled={!hasAvailableCredits}
              onCheckedChange={(checked) => setBestEssayConsent(checked === true)}
              aria-describedby="best-essay-consent-description"
              className="mt-0.5"
            />
            <span id="best-essay-consent-description">
              Autorizo a adição da minha redação ao banco de melhores redações do tema, devidamente
              anonimizada, caso ela seja considerada exemplar
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
