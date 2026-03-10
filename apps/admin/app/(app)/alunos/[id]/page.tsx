import Link from "next/link";
import {
  ArrowLeft,
  FileText,
  Medal,
  CheckCircle2,
  Calendar,
  ChevronDown,
  Eye,
  FileEdit
} from "lucide-react";
import { Button } from "@repo/ui/components/button";
import { Tooltip, TooltipTrigger, TooltipContent } from "@repo/ui/components/tooltip";

// Mocks de Dados baseados no seu design
const studentData = {
  name: "João Silva Santos",
  id: "#882931",
  registrationDate: "15/01/2024",
  email: "joao.silva@email.com",
  avatarUrl: "https://i.pravatar.cc/150?u=joao", // Placeholder
  plan: {
    status: "ATIVO",
    name: "Plano Anual",
    expiresAt: "25/12/2024"
  },
  credits: {
    professor: 10,
    ia: 5
  },
  stats: {
    totalEssays: 14,
    totalTrend: "+2 este mês",
    averageScore: 780,
    averageTrend: "+15% vs inicial",
    lastScore: 840,
    lastScoreTime: "Há 3 dias"
  }
};

const essaysHistory = [
  { id: 1, title: "Impactos da Inteligência Artificial na Educação Brasileira", theme: "Ciência e Tecnologia", date: "24/05/2024", status: "Pendente", score: "--", action: "Corrigir" },
  { id: 2, title: "A persistência da violência contra a mulher na sociedade", theme: "Direitos Humanos", date: "12/05/2024", status: "Corrigido", score: "840", action: "Ver Detalhes" },
  { id: 3, title: "Desafios para a valorização de comunidades tradicionais", theme: "Meio Ambiente e Cultura", date: "05/05/2024", status: "Corrigido", score: "720", action: "Ver Detalhes" },
  { id: 4, title: "Caminhos para combater a intolerância religiosa", theme: "Sociedade", date: "Ontem", status: "Pendente", score: "--", action: "Corrigir" },
];

const creditsHistory = [
  { id: 1, date: "24/05/2024", type: "IA", action: "Uso em Redação", balance: "5 IA", isPositive: false },
  { id: 2, date: "12/05/2024", type: "Professor", action: "Uso em Redação", balance: "10 Professor", isPositive: false },
  { id: 3, date: "01/05/2024", type: "Pacote Plus", action: "Compra", balance: "+15 Prof. | +10 IA", isPositive: true },
];

export default function StudentProfilePage() {
  return (
    <div className="min-h-screen bg-slate-50/50 p-4 md:p-8 font-sans text-slate-900">
      <div className="max-w-[1200px] mx-auto space-y-8">

        {/* Breadcrumb / Voltar */}
        <Link href="/admin/alunos" className="inline-flex items-center text-sm font-bold text-slate-400 hover:text-blue-600 transition-colors">
          <ArrowLeft className="size-4 mr-2" />
          Voltar para Alunos
        </Link>

        {/* =========================================
            CABEÇALHO, ASSINATURA E CRÉDITOS (UNIFICADO)
        ========================================= */}
        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">

          {/* Parte Superior: Info do Aluno */}
          <div className="p-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
              <img src={studentData.avatarUrl} alt="Avatar" className="size-20 rounded-full object-cover" />
              <div>
                <h1 className="text-2xl font-black text-slate-900">{studentData.name}</h1>
                <p className="text-sm font-medium text-slate-500 mt-1">
                  ID: {studentData.id} • Data de Cadastro: {studentData.registrationDate}
                </p>
                <p className="text-sm font-bold text-blue-600 mt-1">{studentData.email}</p>
              </div>
            </div>
            <div>
              <Button className="font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-full h-10 px-6 shadow-sm w-full md:w-auto">
                Editar dados
              </Button>
            </div>
          </div>

          {/* Linha Divisória Horizontal */}
          <div className="h-px bg-slate-200 w-full" />

          {/* Parte Inferior: Assinatura e Créditos (com divisórias verticais) */}
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-200">

            {/* Dados da Assinatura */}
            <div className="p-8 flex flex-col items-center justify-center text-center bg-slate-100">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Dados da Assinatura</h3>
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase px-2.5 py-1 rounded-md tracking-wider">
                  {studentData.plan.status}
                </span>
                <span className="font-black text-slate-900 text-lg">{studentData.plan.name}</span>
              </div>
              <p className="text-sm font-medium text-slate-500">
                Expira em: <span className="font-bold text-slate-900">{studentData.plan.expiresAt}</span>
              </p>
            </div>

            {/* Créditos Professor */}
            <div className="p-8 flex flex-col items-center justify-center bg-slate-100">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Créditos Professor</h3>
              <div className="size-20 rounded-full border-[6px] border-amber-200/40 flex items-center justify-center">
                <span className="text-3xl font-black text-amber-400">{studentData.credits.professor}</span>
              </div>
            </div>

            {/* Créditos IA */}
            <div className="p-8 flex flex-col items-center justify-center bg-slate-100">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Créditos IA</h3>
              <div className="size-20 rounded-full border-[6px] border-blue-100 flex items-center justify-center">
                <span className="text-3xl font-black text-blue-600">{studentData.credits.ia}</span>
              </div>
            </div>

          </div>
        </div>

        {/* =========================================
            CARDS: ESTATÍSTICAS
        ========================================= */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Total Redações */}
          <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 p-6">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total de Redações</h3>
              <FileText className="size-5 text-blue-600" />
            </div>
            <p className="text-4xl font-black text-slate-900">{studentData.stats.totalEssays}</p>
            <p className="text-xs font-bold text-emerald-500 mt-2 flex items-center gap-1">
              <TrendingUpIcon /> {studentData.stats.totalTrend}
            </p>
          </div>

          {/* Média Geral */}
          <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 p-6">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Média Geral</h3>
              <Medal className="size-5 text-amber-500" />
            </div>
            <p className="text-4xl font-black text-slate-900">{studentData.stats.averageScore}</p>
            <p className="text-xs font-bold text-emerald-500 mt-2 flex items-center gap-1">
              <TrendingUpIcon /> {studentData.stats.averageTrend}
            </p>
          </div>

          {/* Última Nota */}
          <div className="bg-white rounded-4xl shadow-sm border border-slate-200 p-6">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Última Nota</h3>
              <CheckCircle2 className="size-5 text-emerald-500" />
            </div>
            <p className="text-4xl font-black text-slate-900">{studentData.stats.lastScore}</p>
            <p className="text-xs font-bold text-slate-400 mt-2">{studentData.stats.lastScoreTime}</p>
          </div>
        </div>

        {/* =========================================
            TABELA: HISTÓRICO DE REDAÇÕES
        ========================================= */}
        <div>
          {/* Título e Filtros da Tabela (Mantingos iguais, pois ficam fora do card da tabela) */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
            <h2 className="text-xl font-black text-slate-900">Histórico de redações</h2>
            <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
              <button className="flex items-center gap-2 px-3 py-1.5 border border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors whitespace-nowrap">
                <Calendar className="size-4" /> Data <ChevronDown className="size-3" />
              </button>
              <div className="flex items-center bg-slate-100 p-1 rounded-lg">
                <button className="px-4 py-1.5 rounded-md text-sm font-bold bg-blue-600 text-white shadow-sm transition-all whitespace-nowrap">Todos</button>
                <button className="px-4 py-1.5 rounded-md text-sm font-bold text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition-all whitespace-nowrap">Corrigidos</button>
                <button className="px-4 py-1.5 rounded-md text-sm font-bold text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition-all whitespace-nowrap">Pendentes</button>
              </div>
            </div>
          </div>

          {/* O CARD DA TABELA DE FATO */}
          <div className="border border-slate-200 rounded-3xl overflow-hidden bg-white shadow-sm">

            {/* Header da Tabela */}
            <div className="hidden lg:grid grid-cols-12 gap-4 px-8 py-4 bg-white border-b border-slate-100">
              <div className="col-span-5 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Redação / Tema</div>
              <div className="col-span-2 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Data de Envio</div>
              <div className="col-span-2 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Status</div>
              <div className="col-span-1 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Nota Final</div>
              <div className="col-span-2 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-right">Ação</div>
            </div>

            {/* Corpo da Tabela */}
            <div className="divide-y divide-slate-100">
              {essaysHistory.map((essay) => (
                <div key={essay.id} className="grid grid-cols-1 lg:grid-cols-12 gap-4 px-8 py-5 items-center hover:bg-slate-50/50 transition-colors">

                  <div className="col-span-1 lg:col-span-5">
                    <p className="font-bold text-[15px] text-slate-900 leading-snug">{essay.title}</p>
                    <p className="text-sm font-medium text-slate-500 mt-0.5">{essay.theme}</p>
                  </div>

                  <div className="col-span-1 lg:col-span-2 flex justify-between lg:block items-center">
                    <span className="lg:hidden text-[11px] font-bold text-slate-500 uppercase tracking-widest">Data de Envio</span>
                    <span className="text-[15px] font-medium text-slate-900">{essay.date}</span>
                  </div>

                  <div className="col-span-1 lg:col-span-2 flex justify-between lg:block items-center">
                    <span className="lg:hidden text-[11px] font-bold text-slate-500 uppercase tracking-widest">Status</span>
                    {/* Badges em formato de pílula (rounded-full) */}
                    <span className={`inline-flex px-3.5 py-1.5 rounded-full text-xs font-bold ${essay.status === 'Corrigido'
                      ? 'bg-emerald-50 text-emerald-600'
                      : 'bg-orange-50 text-orange-600'
                      }`}>
                      {essay.status}
                    </span>
                  </div>

                  <div className="col-span-1 lg:col-span-1 flex justify-between lg:block items-center">
                    <span className="lg:hidden text-[11px] font-bold text-slate-500 uppercase tracking-widest">Nota Final</span>
                    <span className={`text-[15px] font-black ${essay.score === '--' ? 'text-blue-600/50' : 'text-slate-900'}`}>
                      {essay.score}
                    </span>
                  </div>

                  {/* Ação */}
                  <div className="col-span-1 lg:col-span-2 flex justify-end mt-2 lg:mt-0 pt-4 lg:pt-0 border-t border-slate-100 lg:border-t-0">
                    <div className="flex items-center gap-1">

                      {/* Botão Corrigir (Apenas se Pendente) */}
                      {essay.status === 'Pendente' && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 rounded-full text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                            >
                              <FileEdit className="size-4.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent className="bg-slate-900 text-white font-medium text-xs rounded-lg border-none">
                            <p>Corrigir Redação</p>
                          </TooltipContent>
                        </Tooltip>
                      )}

                      {/* Botão Ver Detalhes (Sempre visível) */}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 rounded-full text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          >
                            <Eye className="size-4.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent className="bg-slate-900 text-white font-medium text-xs rounded-lg border-none">
                          <p>Ver Detalhes</p>
                        </TooltipContent>
                      </Tooltip>



                    </div>
                  </div>

                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 flex justify-center">
            <Button variant="outline" className="rounded-full border-blue-200 text-blue-600 font-bold hover:bg-blue-50 px-6 h-10">
              <ChevronDown className="size-4 mr-2" /> Carregar mais atividades
            </Button>
          </div>
        </div>
        {/* =========================================
            TABELA: HISTÓRICO DE CRÉDITOS
        ========================================= */}
        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 p-6 md:p-8">
          <h2 className="text-xl font-black text-slate-900 mb-6">Histórico de Créditos</h2>

          <div className="w-full">
            <div className="hidden lg:grid grid-cols-12 gap-4 pb-4 border-b border-slate-100">
              <div className="col-span-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Data</div>
              <div className="col-span-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tipo de Crédito</div>
              <div className="col-span-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ação</div>
              <div className="col-span-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Saldo</div>
            </div>

            <div className="divide-y divide-slate-100">
              {creditsHistory.map((credit) => (
                <div key={credit.id} className="grid grid-cols-1 lg:grid-cols-12 gap-4 py-4 items-center hover:bg-slate-50/50 transition-colors">
                  <div className="col-span-1 lg:col-span-3 flex justify-between lg:block">
                    <span className="lg:hidden text-[10px] font-bold text-slate-400 uppercase tracking-widest">Data</span>
                    <span className="text-sm font-bold text-slate-700">{credit.date}</span>
                  </div>
                  <div className="col-span-1 lg:col-span-3 flex justify-between lg:block">
                    <span className="lg:hidden text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tipo</span>
                    <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${credit.type === 'IA' ? 'bg-blue-50 text-blue-600' : credit.type === 'Professor' ? 'bg-amber-50 text-amber-600' : 'bg-purple-50 text-purple-600'
                      }`}>
                      {credit.type}
                    </span>
                  </div>
                  <div className="col-span-1 lg:col-span-4 flex justify-between lg:block">
                    <span className="lg:hidden text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ação</span>
                    <span className={`text-sm font-bold ${credit.isPositive ? 'text-emerald-600' : 'text-slate-700'}`}>{credit.action}</span>
                  </div>
                  <div className="col-span-1 lg:col-span-2 flex justify-between lg:block lg:text-right mt-2 lg:mt-0 pt-2 lg:pt-0 border-t border-slate-100 lg:border-t-0">
                    <span className="lg:hidden text-[10px] font-bold text-slate-400 uppercase tracking-widest">Saldo</span>
                    <span className="text-sm font-black text-slate-900">{credit.balance}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

// Pequeno ícone auxiliar para as trends (+2 este mês)
function TrendingUpIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline>
      <polyline points="16 7 22 7 22 13"></polyline>
    </svg>
  )
}