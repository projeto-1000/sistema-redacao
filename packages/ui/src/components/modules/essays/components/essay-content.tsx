import { MessageSquareText } from "lucide-react";
import { Highlight, HighlightedText } from "./highlighted-text";

interface EssayContentProps {
  text: string;
  highlights: Highlight[];
  generalComment: string;
}

export default function EssayContent({ text, highlights, generalComment }: EssayContentProps) {
  return (
    <div className="xl:col-span-7 space-y-8">
      <div className="bg-white rounded-4xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-8 py-6 border-b border-slate-100 uppercase tracking-widest text-[10px] font-bold text-slate-400">
          Texto do Aluno
        </div>

        <div className="p-8 md:p-10 text-slate-700 text-justify text-lg leading-relaxed whitespace-pre-wrap wrap-break-word">
          <HighlightedText text={text} highlights={highlights} />
        </div>
      </div>

      <div className="bg-white rounded-4xl p-8 border border-slate-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="size-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
            <MessageSquareText className="size-4" />
          </div>
          <h3 className="text-lg font-black">Comentário Geral do Corretor</h3>
        </div>
        <div className="space-y-4 text-slate-600 leading-relaxed whitespace-pre-wrap">
          {generalComment}
        </div>
      </div>
    </div>
  )
}