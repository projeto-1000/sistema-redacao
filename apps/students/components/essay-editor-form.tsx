"use client";

import { useState, useActionState, useEffect } from "react";
import { Save, AlertCircle } from "lucide-react";
import { Button } from "@repo/ui/components/button";
import { submitEssay } from "@/app/actions/submit-essay";
import { SubmitEssayButton } from "./submit-essay-button";
import { EssayTopicDetail } from "@repo/types";
interface EssayEditorFormProps {
  topic: EssayTopicDetail,
  onSuccess: () => void;
}

export function EssayEditorForm({ topic, onSuccess }: EssayEditorFormProps) {
  const [text, setText] = useState("");

  const [state, formAction] = useActionState(
    submitEssay.bind(null, topic.id, topic.title, topic.axis),
    { error: "", success: false }
  );

  useEffect(() => {
    if (state?.success) {
      onSuccess();
    }
  }, [state, onSuccess]);

  const MAX_CHARS = 10000;
  const MIN_CHARS = 100;
  const charCount = text.length;
  const progressPercentage = Math.min((charCount / MAX_CHARS) * 100, 100);

  const isOverLimit = charCount > MAX_CHARS;
  const isTooShort = charCount < MIN_CHARS;
  const progressColor = isOverLimit ? "bg-red-500" : "bg-primary";

  return (
    <form action={formAction} className="flex flex-col h-full gap-4">

      <input type="hidden" name="topicId" value={topic.id} />
      <input type="hidden" name="title" value={topic.title} />
      <input type="hidden" name="thematicAxis" value={topic.axis} />

      <div className="bg-white rounded-3xl border border-slate-200 flex flex-col flex-1 shadow-sm overflow-hidden relative">
        <div className="flex flex-col md:flex-row md:items-center justify-between p-5 border-b border-slate-100 gap-4 bg-slate-50/30">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold text-lg">
                Folha de Redação
              </h3>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider">
              <span className="bg-[#EBC84C]/20 text-[#8B781F] px-2 py-0.5 rounded-md flex items-center gap-1">
                Custa 1 crédito
              </span>
            </div>
          </div>
        </div>


        {state.error && (
          <div className="mx-6 mt-6 p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2 text-red-600 text-sm font-medium animate-in slide-in-from-top-2">
            <AlertCircle className="size-4 shrink-0" />
            {state.error}
          </div>
        )}

        <div className="flex-1 relative flex flex-col p-6">
          <label htmlFor="essay-text" className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Seu texto
          </label>

          <textarea
            id="essay-text"
            name="content"
            className="flex-1 w-full resize-none outline-none text-slate-700 leading-relaxed placeholder:text-slate-300 text-base font-medium bg-transparent"
            placeholder="Primeiro, escreva sua redação à mão, como no dia da prova. Depois, transcreva-a aqui."
            value={text}
            onChange={(e) => setText(e.target.value)}
            spellCheck={false}
          />

          <div className="flex justify-end mt-4">
            <div className="bg-slate-50 border border-slate-200 rounded-full px-4 py-1.5 flex items-center gap-3 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Caracteres
              </span>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold ${isOverLimit ? "text-red-500" : "text-slate-900"}`}>
                  {charCount.toLocaleString('pt-BR')} <span className="text-slate-300">/</span> {MAX_CHARS.toLocaleString('pt-BR')}
                </span>
                <div className="w-12 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${progressColor}`}
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-5 border-t border-slate-200 flex flex-col sm:flex-row items-center gap-4 justify-between">

          <SubmitEssayButton disabled={isOverLimit || isTooShort} />

          <Button
            type="button"
            variant="outline"
            disabled={isTooShort}
            className="w-full sm:w-auto font-bold rounded-full h-12 px-6 gap-2"
          >
            <Save className="size-4" />
            Salvar Rascunho
          </Button>

        </div>
      </div>
    </form>
  );
}