import { Award, MessageSquareText } from "lucide-react";
import { Highlight, HighlightedText } from "./highlighted-text";
import { COMPETENCY_INFO } from "../../constants";
interface EssayContentProps {
  text: string;
  highlights: Highlight[];
  generalComment: string;
  bestScores: string[]
}

export default function EssayContent({ text, highlights, generalComment, bestScores }: EssayContentProps) {
  return (
    <div className="space-y-8">
      <div className="bg-white rounded-4xl shadow-sm border border-slate-200 overflow-hidden">

        <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between w-full">
          <span className="uppercase tracking-widest text-[10px] font-bold text-slate-400  sm:whitespace-nowrap text-left">
            Texto do Aluno
          </span>

          {bestScores.length > 0 && (
            <div className="flex flex-wrap gap-2 items-center justify-end">
              <Award className="size-4 text-amber-400 mr-1" />

              {bestScores.map((scoreId) => {
                const info = COMPETENCY_INFO.find((comp) => comp.id === scoreId);
                if (!info) return null;

                const competencyName = info.title.split(":")[1]?.trim()

                return (
                  <span
                    key={info.id}
                    className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider w-fit border ${info.bg} ${info.text} ${info.border}`}
                  >
                    {competencyName}
                  </span>
                );
              })}
            </div>
          )}
        </div>

        <HighlightedText text={text} highlights={highlights} />

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