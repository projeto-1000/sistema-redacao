import Link from "next/link";
import { Button } from "@repo/ui/components/button";
import { RotateCcw, Plus, Calendar, MessageSquareText, Star } from "lucide-react";
import { getEssayById } from "@/services/get-essays";
import { formatDate } from "@repo/utils";
import { mapEssayToCompetencies } from "@/utils/essay-mapper";

const COMPETENCY_STYLES = {
  1: {
    badge: "bg-[#FFEDEA] text-[#CC3725]",
    border: "border-[#CC3725]",
  },
  2: {
    badge: "bg-[#E6F0FF] text-[#0052CC]",
    border: "border-[#0052CC]",
  },
  3: {
    badge: "bg-[#FFF9E6] text-[#B58500]",
    border: "border-[#FFC400]",
  },
  4: {
    badge: "bg-[#E3FCEF] text-[#006644]",
    border: "border-[#00875A]",
  },
  5: {
    badge: "bg-[#F3E9FF] text-[#6E40C9]",
    border: "border-[#8755DE]",
  }
};

export default async function EssayFeedbackPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getEssayById(id)
  const competencies = mapEssayToCompetencies(data);

  return (
    <div className="px-4 md:px-10 lg:px-12 py-4">
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div>
            <h1 className="text-3xl font-extrabold mb-2">Análise Detalhada: {data.title}</h1>
            <p className="text-slate-500 font-medium text-sm flex items-center gap-2">
              Avaliação seguindo critérios oficiais do ENEM • <Calendar className="size-3" /> {formatDate(data.submission_date, 'long')}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link href={`/minhas-redacoes/nova-redacao?id=${data.topic_id}`}>
              <Button variant="outline" className="bg-white border-blue-200 text-blue-600 hover:bg-blue-50 font-bold gap-2 h-10 rounded-full">
                <RotateCcw className="size-4" />
                Refazer Redação
              </Button>
            </Link>

            <Link href="/temas">
              <Button className="font-bold gap-2 h-10 rounded-full shadow-md shadow-yellow-500/10">
                <Plus className="size-4" />
                Nova Redação
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">

            <div className="flex justify-between items-center mb-6 pb-6 border-b border-slate-50">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Texto do Aluno</span>

              <div className="flex flex-wrap gap-2">
                {competencies
                  .filter((comp) => comp.score === 200)
                  .map((comp) => {
                    const style = COMPETENCY_STYLES[comp.id as keyof typeof COMPETENCY_STYLES];
                    const cleanName = comp.name.split(":")[1]?.trim();

                    return (
                      <span
                        key={comp.id}
                        className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${style.badge} ${style.border} bg-opacity-50`}
                      >
                        {cleanName}
                      </span>
                    );
                  })}
              </div>
            </div>

            <h2 className="text-xl font-bold text-center mb-8 max-w-2xl mx-auto leading-tight">
              {data.title}
            </h2>

            <p className="prose prose-slate whitespace-pre-line max-w-none text-slate-600 text-justify text-lg">
              {data.content}
            </p>

          </div>

          <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-purple-100 p-2 rounded-lg text-purple-600">
                <MessageSquareText className="size-5" />
              </div>
              <h3 className="text-lg font-bold">Comentário Geral do Corretor</h3>
            </div>

            {data.general_comment ? (
              <p className="text-slate-600 leading-relaxed text-sm md:text-base">
                {data.general_comment}
              </p>
            ) : (
              <p className="text-slate-400 italic text-sm bg-slate-50 p-4 rounded-xl border border-slate-100">
                Nenhum comentário geral registrado pelo corretor.
              </p>
            )}
          </div>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <div className="bg-[#0F172A] rounded-3xl p-8 text-white shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-10">
              <Star className="size-22" />
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
              Nota Total ENEM
            </p>
            <div className="flex items-baseline gap-1">
              <span className="text-5xl font-extrabold text-[#EBC84C]">
                {data.total_score}
              </span>
              <span className="text-xl text-slate-400 font-medium">/ 1000</span>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-4">
              <span className="bg-[#EBC84C] w-1 h-4 rounded-full block"></span>
              Desempenho por Competência
            </h4>

            {competencies.map((comp) => {
              const style = COMPETENCY_STYLES[comp.id as keyof typeof COMPETENCY_STYLES];
              return (
                <div key={comp.id} className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h5 className="font-bold text-sm">{comp.name}</h5>
                      <p className="text-xs text-slate-400 font-medium mt-0.5">{comp.description}</p>
                    </div>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${style.badge}`}>
                      {comp.score}/200
                    </span>
                  </div>

                  <div className={`mt-3 p-3 rounded-r-xl rounded-bl-xl border-l-4 ${style.border} bg-slate-50`}>
                    <p className="text-xs text-slate-600 italic leading-relaxed font-medium">
                      {`"${comp.comment}"`}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}