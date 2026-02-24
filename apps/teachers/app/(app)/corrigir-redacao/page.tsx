"use client";

import { CompetencyCard } from "@/components/competency-card";
import { EssayViewer } from "@/components/essay-viewer";
import { StickyScore } from "@/components/sticky-score";
import { useGradingStore } from "@/stores/use-grading-store";
import { useEffect, useState } from "react";


const MOCK_ESSAY = {
  id: "12",
  student: "João Silva",
  class: "Turma 3º Ano A",
  topic: "Inteligência Artificial",
  title: "O Impacto da Inteligência Artificial na Educação do Século XXI",
  text: `No cenário contemporâneo, a integração das tecnologias digitais no ambiente escolar tornou-se um debate central na sociedade brasileira. A ascensão da Inteligência Artificial (IA) promete revolucionar métodos pedagógicos tradicionais, oferecendo personalização e eficiência sem precedentes. No entanto, esse avanço traz consigo desafios éticos e estruturais que não podem ser ignorados pelo Estado nem pela comunidade educacional.

Em primeira análise, cabe pontuar que a IA permite um ensino adaptativo. Por meio de algoritmos, é possível identificar as lacunas individuais de aprendizado de cada discente, permitindo que o professor atue de forma mais cirúrgica. Historicamente, o modelo de ensino "tamanho único" herdado da revolução industrial negligencia as subjetividades. Com o suporte tecnológico, a democratização do conhecimento de alta qualidade torna-se mais palpável, desde que haja infraestrutura adequada.

Contudo, a "exclusão digital" permanece como um entrave severo. Enquanto escolas privadas de elite já implementam ferramentas avançadas, a rede pública muitas vezes carece do básico, como conexão estável e hardware funcional. Essa disparidade amplia o abismo socioeducacional no país. Ademais, a dependência excessiva de ferramentas automatizadas pode atrofiar o pensamento crítico e a produção textual autêntica, transformando estudantes em meros operadores de comandos prontos.

Portanto, é imperativo que o Ministério da Educação promova a capacitação docente para o uso ético da IA. Além disso, o Governo Federal deve investir em infraestrutura digital nas escolas periféricas para garantir a equidade. Somente unindo a inovação tecnológica ao investimento humano será possível construir uma educação verdadeiramente transformadora e inclusiva no Brasil contemporâneo.`,
};

const COMPETENCIES = [
  {
    id: "C1",
    title: "Domínio da Norma Culta",
    description: "Demonstrar domínio da modalidade escrita formal da língua portuguesa."
  },
  {
    id: "C2",
    title: "Compreensão do Tema",
    description: "Compreender a proposta e aplicar conceitos de várias áreas do conhecimento dentro da estrutura dissertativo-argumentativa."
  },
  {
    id: "C3",
    title: "Organização de Ideias",
    description: "Selecionar, relacionar, organizar e interpretar informações, fatos, opiniões e argumentos em defesa de um ponto de vista."
  },
  {
    id: "C4",
    title: "Coesão Textual",
    description: "Demonstrar conhecimento dos mecanismos linguísticos e conectivos necessários para a construção da argumentação."
  },
  {
    id: "C5",
    title: "Proposta de Intervenção",
    description: "Elaborar proposta de intervenção detalhada (agente, ação, meio, finalidade e detalhamento) respeitando os direitos humanos."
  },
];

export default function EssayCorrectionPage() {
  const [activeTab, setActiveTab] = useState<"text" | "proposal">("text");

  // const [scores, setScores] = useState<Record<string, number>>({
  //   c1: 0, c2: 0, c3: 0, c4: 0, c5: 0,
  // });

  // const [comments, setComments] = useState<Record<string, string>>({
  //   c1: "", c2: "", c3: "", c4: "", c5: "", general: ""
  // });

  // const totalScore = Object.values(scores).reduce((acc, curr) => acc + curr, 0);

  // const handleSave = () => {
  //   console.log("Salvando correção...", { scores, comments, totalScore });
  //   alert("Correção salva com sucesso!");
  // };

  const generalComment = useGradingStore((state) => state.generalComment);
  const setGeneralComment = useGradingStore((state) => state.setGeneralComment);
  const resetStore = useGradingStore((state) => state.reset);

  // Limpa a store quando o professor sai da página (boa prática!)
  useEffect(() => {
    return () => resetStore();
  }, [resetStore]);

  return (
    <div className="min-h-screen flex flex-col">
      <h1 className="text-3xl font-extrabold px-6 md:px-10 py-6">
        Espaço de Correção
      </h1>

      <div className="flex-1 px-6 md:px-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pb-20">

        {/* ESQUERDA: Texto e Proposta */}
        <EssayViewer
          essay={MOCK_ESSAY}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        {/* DIREITA: Painel de Competências */}
        <div className="lg:col-span-5 flex flex-col gap-6 relative">

          {COMPETENCIES.map((comp) => (
            <CompetencyCard
              key={comp.id}
              comp={comp}
            // score={scores[comp.id]}
            // comment={comments[comp.id]}
            // onScoreChange={(val) => setScores(prev => ({ ...prev, [comp.id]: val }))}
            // onCommentChange={(val) => setComments(prev => ({ ...prev, [comp.id]: val }))}
            />
          ))}

          {/* Comentário Geral */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 mb-32">
            <h3 className="font-bold mb-4">Comentário Geral</h3>
            <textarea
              placeholder="Dê um feedback holístico para o aluno..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-700 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-amber-400/50 resize-none h-32"
              value={generalComment}
              onChange={(e) => setGeneralComment(e.target.value)}
            />
          </div>

          {/* Componente Flutuante de Nota Total */}
          <StickyScore />
        </div>
      </div>
    </div>
  );
}