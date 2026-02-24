"use client";

import { ArrowLeft, Calendar, ChartNoAxesColumn, MessageSquareText, Pencil, Star, User } from "lucide-react";
import Link from "next/link";
import { Button } from "@repo/ui/components/button";

// --- DADOS MOCADOS PARA TESTE VISUAL ---
const MOCK_DATA = {
  studentName: "João Pedro Silva",
  submittedAt: "24 de Outubro de 2025",
  title: "O Impacto da Tecnologia na Sociedade Contemporânea",
  totalScore: 880,
  text: "Historicamente, a humanidade sempre buscou formas de encurtar distâncias e facilitar a comunicação. No entanto, com o advento da internet e a onipresença da tecnologia no cotidiano, percebe-se um fenômeno paradoxal: embora estejamos mais conectados virtualmente, o isolamento social parece crescer em proporções alarmantes.\n\nEm primeira análise, é fundamental observar como as redes sociais alteraram a dinâmica das relações interpessoais. A tecnologia ela proporciona uma sensação de proximidade constante que, muitas vezes, é superficial. O vício em dopamina, gerado pelas curtidas e notificações, faz com que o indivíduo priorize a validação digital em detrimento das interações físicas.\n\nAlém disso, a desinformação propiciada pela rapidez dos fluxos de dados compromete a capacidade crítica dos cidadãos. Este cenário exige uma postura mais ativa das instituições de ensino no sentido de promover o letramento digital, garantindo que o progresso tecnológico não resulte em um retrocesso intelectual ou social.",
  highlights: [
    // Note: Os compId devem bater com as chaves do HIGHLIGHT_STYLES (c1, c2...)
    { id: "1", text: "com o advento da internet e a onipresença da tecnologia", compId: "c3" },
    { id: "2", text: "A tecnologia ela proporciona", compId: "c1" },
    { id: "3", text: "Este cenário exige uma postura mais ativa das instituições de ensino", compId: "c2" },
  ],
  scores: {
    c1: 160,
    c2: 200,
    c3: 160,
    c4: 200,
    c5: 160,
  },
  comments: {
    c1: "Cuidado com repetições desnecessárias e pleonasmos como 'A tecnologia ela'. Revise a concordância em períodos longos.",
    c2: "Excelente uso de repertório sociocultural. A relação entre isolamento e hiperconectividade foi muito bem abordada.",
    c3: "Seus argumentos são sólidos, mas poderiam ser mais detalhados no segundo parágrafo de desenvolvimento.",
    c4: "Uso exemplar de conectivos interparágrafos e intraparágrafos. O texto flui com muita naturalidade.",
    c5: "Faltou detalhar o 'como'. Explique melhor a dinâmica das parcerias entre o MEC e as empresas de tecnologia.",
  },
  generalComment: "Sua redação apresenta uma excelente base argumentativa e uma estrutura bem definida, respeitando as quatro etapas fundamentais da dissertação-argumentativa. O repertório sociocultural foi bem mobilizado na introdução, criando um gancho interessante para o desenvolvimento.\n\nEntretanto, atente-se para pequenos desvios de gramática (pleonasmos) e para o detalhamento da sua proposta de intervenção. Você identificou bem o agente e a ação, mas o 'como' (meio/modo) poderia ser mais explorado para garantir a nota máxima na Competência 5. No geral, um excelente desempenho!"
};

// --- ESTILOS CORRETOS TRAZIDOS DE VOLTA ---
// Usando exatamente a definição que criamos para usar as cores globais do tema
const HIGHLIGHT_STYLES = {
  c1: "bg-comp-1/10 border-b-2 border-comp-1",
  c2: "bg-comp-2/10 border-b-2 border-comp-2",
  c3: "bg-comp-3/20 border-b-2 border-comp-3",
  c4: "bg-comp-4/10 border-b-2 border-comp-4",
  c5: "bg-comp-5/10 border-b-2 border-comp-5",
};

const COMPETENCY_INFO = [
  { id: "c1", title: "C1: Norma Culta", desc: "Domínio da norma culta da língua escrita.", bg: "bg-comp-1/10", text: "text-comp-1", border: "border-comp-1" },
  { id: "c2", title: "C2: Compreensão do Tema", desc: "Compreender a proposta e aplicar conceitos.", bg: "bg-comp-2/10", text: "text-comp-2", border: "border-comp-2" },
  { id: "c3", title: "C3: Argumentação", desc: "Selecionar, relacionar e interpretar informações.", bg: "bg-comp-3/10", text: "text-[#B58500]", border: "border-comp-3" }, // C3 com /20 para dar leitura
  { id: "c4", title: "C4: Coesão", desc: "Conhecimento dos mecanismos linguísticos.", bg: "bg-comp-4/10", text: "text-comp-4", border: "border-comp-4" },
  { id: "c5", title: "C5: Proposta de Intervenção", desc: "Elaborar proposta para o problema abordado.", bg: "bg-comp-5/10", text: "text-comp-5", border: "border-comp-5" },
];


export default function GradedEssayPage({ params }: { params: { id: string } }) {

  // Função Corrigida para renderizar os grifos
  const renderHighlightedText = (paragraph: string) => {
    let result: React.ReactNode[] = [paragraph];

    MOCK_DATA.highlights.forEach((highlight) => {
      const newResult: React.ReactNode[] = [];
      result.forEach((part) => {
        if (typeof part === "string" && part.includes(highlight.text)) {
          const splitText = part.split(highlight.text);
          splitText.forEach((fragment, index) => {
            newResult.push(fragment);
            if (index < splitText.length - 1) {

              const styleClass = HIGHLIGHT_STYLES[highlight.compId as keyof typeof HIGHLIGHT_STYLES];

              newResult.push(
                <mark
                  key={`${highlight.id}-${index}`}
                  className={`${styleClass} pb-0.5`}
                >
                  {highlight.text}
                </mark>
              );
            }
          });
        } else {
          newResult.push(part);
        }
      });
      result = newResult;
    });

    return result;
  };

  return (
    // <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
    <div className="px-4 md:px-10 lg:px-12 py-4">
      {/* HEADER DA PÁGINA */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-10">
        <div>

          <h1 className="text-3xl font-black mb-4">{MOCK_DATA.title}</h1>

          <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-slate-600">
            <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-full">
              <User className="size-4 text-slate-400" />
              {MOCK_DATA.studentName}
            </div>
            <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-full">
              <Calendar className="size-4 text-slate-400" />
              Avaliada em {MOCK_DATA.submittedAt}
            </div>
          </div>
        </div>

        {/* Botões de Ação do Professor */}
        <div className="flex items-center gap-3 shrink-0">
          <Button variant="outline" asChild className="rounded-xl font-bold h-11 border-slate-200">
            <Link href="/redacoes-corrigidas">
              <ArrowLeft className="size-4 mr-2" />
              Voltar
            </Link>
          </Button>

          <Button asChild className="rounded-xl font-bold h-11">
            <Link href={`/corrigir-redacao/${params.id}`}>
              <Pencil className="size-4 mr-2" />
              Editar Correção
            </Link>
          </Button>
        </div>
      </div>

      {/* GRID PRINCIPAL */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">

        {/* COLUNA ESQUERDA: Texto e Comentário Geral */}
        <div className="xl:col-span-7 space-y-8">

          <div className="bg-white rounded-4xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Texto do Aluno</span>
            </div>

            <div className="p-8 md:p-10 space-y-6 text-slate-700 text-justify">
              {MOCK_DATA.text.split("\n\n").map((paragraph, idx) => (
                <p key={idx}>{renderHighlightedText(paragraph)}</p>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-4xl p-8 border border-slate-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="size-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                <MessageSquareText className="size-4" />
              </div>
              <h3 className="text-lg font-black">Comentário Geral do Corretor</h3>
            </div>
            <div className="space-y-4 text-slate-600 leading-relaxed">
              {MOCK_DATA.generalComment.split("\n\n").map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          </div>

        </div>

        {/* COLUNA DIREITA: Nota Total e Competências */}
        <div className="xl:col-span-5 space-y-6">

          <div className="bg-[#0F172A] rounded-3xl p-8 text-white shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-10">
              <Star className="size-22" />
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
              Nota total do aluno
            </p>
            <div className="flex items-baseline gap-1">
              <span className="text-5xl font-extrabold text-[#EBC84C]">
                {MOCK_DATA.totalScore}
              </span>
              <span className="text-xl text-slate-400 font-medium">/ 1000</span>
            </div>
          </div>

          <div className="bg-white rounded-4xl p-6 sm:p-8 shadow-sm border border-slate-200">
            <h3 className="font-bold mb-6 flex items-center gap-2">
              <ChartNoAxesColumn className="size-5 text-primary stroke-3" />
              Desempenho por Competência
            </h3>

            <div className="space-y-6">
              {COMPETENCY_INFO.map((comp) => {
                const score = MOCK_DATA.scores[comp.id as keyof typeof MOCK_DATA.scores];
                const comment = MOCK_DATA.comments[comp.id as keyof typeof MOCK_DATA.comments];

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