import { getEssayById } from "@/app/actions/get-essays";
import EssayHeader from "@repo/ui/components/features/essays/components/essay-header";
import EssayContent from "@repo/ui/components/features/essays/components/essay-content";
import { EssayCompetencies, EssayScoreCard } from "@repo/ui/components/features/essays/components/essay-sidebar";
import { notFound } from "next/navigation";

export default async function EssayFeedbackPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const essay = await getEssayById(id)

  if (!essay) return notFound();

  const bestScores = Object.keys(essay.scores).filter(
    (key) => essay.scores[key as keyof typeof essay.scores] === 200
  );

  return (
    <div className="px-4 md:px-10 lg:px-12 py-4">

      <EssayHeader
        title={essay.title}
        date={essay.correctedAt}
      />


      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
        <EssayContent
          text={essay.text}
          highlights={essay.highlights}
          generalComment={essay.generalComment}
          bestScores={bestScores}

        />


        <div className="lg:col-span-2 space-y-6">
          <EssayScoreCard
            totalScore={essay.totalScore}
          />

          <EssayCompetencies
            scores={essay.scores}
            comments={essay.comments}
          />
        </div>

      </div>
      {/* <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

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
              {essay.title}
            </h2>

            <p className="prose prose-slate whitespace-pre-line max-w-none text-slate-600 text-justify text-lg">
              {essay.content}
            </p>

          </div>

          <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-purple-100 p-2 rounded-lg text-purple-600">
                <MessageSquareText className="size-5" />
              </div>
              <h3 className="text-lg font-bold">Comentário Geral do Corretor</h3>
            </div>

            {essay.general_comment ? (
              <p className="text-slate-600 leading-relaxed text-sm md:text-base">
                {essay.general_comment}
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
                {essay.total_score}
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
      </div> */}
    </div>
  );
}