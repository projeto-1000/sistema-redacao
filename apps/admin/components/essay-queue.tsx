import { Button } from "@repo/ui/components/button";
import { ArrowRight, Clock } from "lucide-react";
import Link from "next/link";

export type EssayType = {
  id: string;
  student: string;
  topic: string;
  submissionDate: string;
  deadline: string;
  status: "urgent" | "warning" | "normal" | "expired"; // <-- Adicionei o expired aqui!
  deadlineLabel: string;
};

export const MOCK_ESSAYS: EssayType[] = [
  {
    id: "uuid-1",
    student: "Ana Luíza Silva",
    topic: "Inteligência Artificial no Brasil e seus impactos no mercado de trabalho",
    submissionDate: "Hoje, 08:30",
    deadline: "2 horas",
    status: "urgent",
    deadlineLabel: "Vence hoje às 14:00"
  },
  {
    id: "uuid-2",
    student: "Bruno Soares",
    topic: "Educação Financeira nas Escolas públicas como ferramenta de transformação",
    submissionDate: "Ontem, 15:45",
    deadline: "5 horas",
    status: "warning",
    deadlineLabel: "Vence hoje às 17:00"
  },
  {
    id: "uuid-3",
    student: "Maria Costa",
    topic: "O desafio do saneamento básico no Brasil do século XXI",
    submissionDate: "10 de Outubro",
    deadline: "1 dia",
    status: "normal",
    deadlineLabel: "Vence amanhã às 23:59"
  },
  {
    id: "uuid-4",
    student: "João Paulo",
    topic: "Caminhos para combater a intolerância religiosa no Brasil",
    submissionDate: "08 de Outubro",
    deadline: "Atrasado",
    status: "expired",
    deadlineLabel: "Venceu ontem às 23:59"
  },
  {
    id: "uuid-5",
    student: "Fernanda", // Coloquei seu nome para testar a busca rápida! :)
    topic: "A importância da leitura na formação crítica do indivíduo na sociedade contemporânea",
    submissionDate: "11 de Outubro",
    deadline: "3 dias",
    status: "normal",
    deadlineLabel: "Vence em 15 de Outubro"
  }
];

export default function EssayQueue() {

  const renderStatusBadge = (status: string, text: string, label: string) => {
    let classes = "border-blue-500 text-blue-700 bg-blue-100"; // Default (Normal)

    if (status === 'urgent' || status === 'expired') {
      classes = "border-red-500 text-red-700 bg-red-100";
    } else if (status === 'warning') {
      classes = "border-amber-400 text-amber-700 bg-amber-100";
    }

    return (
      <div className={`
        inline-flex px-3 py-1.5 text-[10px] font-bold uppercase rounded-full border tracking-wide 
        whitespace-nowrap items-center justify-center gap-1.5 ${classes}
      `} title={label}>
        <Clock className="size-3" />
        {text}
      </div>
    );
  };

  return (
    <div className="rounded-4xl border border-slate-200 overflow-hidden shadow-sm mt-8 bg-white">

      <div className="flex justify-between items-center p-8">
        <h3 className="text-lg font-bold text-slate-900">Fila de Correção</h3>
        <button className="text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors">
          Ver fila completa
        </button>
      </div>

      {/* Header da tabela */}

      {MOCK_ESSAYS.length > 0 ? (
        <>
          <div className="hidden lg:grid grid-cols-12 gap-4 px-8 pb-5 border-b border-slate-100">
            <div className="col-span-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Aluno
            </div>
            <div className="col-span-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Tema da Redação
            </div>
            <div className="col-span-2 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Prazo
            </div>
            <div className="col-span-1 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Ação
            </div>
          </div>

          {/* Corpo da Tabela */}
          <div className="divide-y divide-slate-100">
            {MOCK_ESSAYS.map((essay) => (
              <div
                key={essay.id}
                className="grid grid-cols-1 lg:grid-cols-12 gap-2 lg:gap-4 px-8 py-5 items-center hover:bg-slate-50 transition-colors group"
              >
                {/* Coluna 1: Aluno */}
                <div className="lg:col-span-3 flex items-center gap-4">
                  <div className="size-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xs shrink-0 border border-slate-200">
                    {essay.student.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm leading-snug group-hover:text-[#1E3A8A] transition-colors">
                      {essay.student}
                    </h4>
                    <span className="text-xs text-slate-400 ">
                      Enviado em {essay.submissionDate}
                    </span>
                  </div>
                </div>

                {/* Coluna 2: Tema */}
                <div className="lg:col-span-6 mt-2 lg:mt-0">
                  <span className="lg:hidden text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                    Tema
                  </span>
                  <p className="text-sm font-medium leading-snug line-clamp-2" title={essay.topic}>
                    {essay.topic}
                  </p>
                </div>

                {/* Coluna 3: Prazo (Badge) */}
                <div className="lg:col-span-2 flex lg:justify-center">
                  {renderStatusBadge(essay.status, essay.deadline, essay.deadlineLabel)}
                </div>

                {/* Coluna 4: Ação */}
                <div className="lg:col-span-1 flex justify-end">
                  <Button
                    asChild
                    variant='secondary'
                    className="rounded-full font-bold shadow-sm h-9 whitespace-nowrap transition-transform"
                  >
                    {/* Ajustei o link para bater com a rota que usamos na dashboard */}
                    <Link href="/">
                      Corrigir
                      <ArrowRight className="size-4 ml-1.5" />
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <>oie</>
      )}

    </div>
  )
}