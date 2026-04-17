import { Calendar, ChartNoAxesColumn, MessageSquareText, Star, User } from "lucide-react";
import { notFound } from "next/navigation";
import { getGradedEssay } from "@/app/actions/essays";
import { COMPETENCY_INFO, formatDate } from "@repo/utils";
import { HighlightedText } from "@/components/highlighted-text";

export default async function GradedEssayPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params;
  const essay = await getGradedEssay(id);

  if (!essay) return notFound();

  return (
    <div className="px-4 md:px-10 lg:px-12 py-4">

      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-black mb-4">{essay.title}</h1>
          <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-slate-600">
            <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-full">
              <User className="size-4 text-slate-400" />
              {essay.studentName}
            </div>
            <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-full">
              <Calendar className="size-4 text-slate-400" />
              Avaliada em {formatDate(essay.submittedAt, 'long')}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">

        <div className="xl:col-span-7 space-y-8">
          <div className="bg-white rounded-4xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-100 uppercase tracking-widest text-[10px] font-bold text-slate-400">
              Texto do Aluno
            </div>

            <div className="p-8 md:p-10 text-slate-700 text-justify text-lg leading-relaxed whitespace-pre-wrap wrap-break-word">
              <HighlightedText text={essay.text} highlights={essay.highlights} />
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
              {essay.generalComment}
            </div>
          </div>
        </div>

        <div className="xl:col-span-5 space-y-6">
          <div className="bg-[#0F172A] rounded-3xl p-8 text-white shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-10">
              <Star className="size-20" />
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Nota total</p>
            <div className="flex items-baseline gap-1">
              <span className="text-5xl font-extrabold text-[#EBC84C]">{essay.totalScore}</span>
              <span className="text-xl text-slate-400 font-medium">/ 1000</span>
            </div>
          </div>

          <div className="bg-white rounded-4xl p-8 shadow-sm border border-slate-200">
            <h3 className="font-bold mb-6 flex items-center gap-2">
              <ChartNoAxesColumn className="size-5 text-primary" />
              Desempenho por Competência
            </h3>

            <div className="space-y-6">
              {COMPETENCY_INFO.map((comp) => {
                const score = essay.scores[comp.id as keyof typeof essay.scores];
                const comment = essay.comments[comp.id as keyof typeof essay.comments];

                return (
                  <div key={comp.id} className="group">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-bold text-sm">{comp.title}</h4>
                        <p className="text-[11px] text-slate-400 mt-0.5">{comp.desc}</p>
                      </div>
                      <div className={`font-black text-sm px-2 py-1 rounded-md ${comp.bg} ${comp.text}`}>
                        {score}<span className="opacity-50 font-bold">/200</span>
                      </div>
                    </div>
                    <div className={`mt-3 border-l-3 ${comp.border} pl-4 py-1 text-sm text-slate-700 italic`}>
                      {`"${comment}"`}
                    </div>
                    {comp.id !== "c5" && <div className="h-px w-full bg-slate-100 mt-6"></div>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}