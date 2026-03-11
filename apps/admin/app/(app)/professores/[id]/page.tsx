import Link from "next/link";
import {
  ChevronRight,
  Lock,
  Pencil,
  CreditCard,
  Calendar,
  BarChart2,
  Search,
  X,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  FileText
} from "lucide-react";
import { Button } from "@repo/ui/components/button";

// Mocks baseados no Figma
const profData = {
  name: "Carlos Andrade",
  email: "carlos.andrade@email.com",
  initials: "CA",
  id: "#PROF-2024-89",
  status: "Ativo",
  since: "15/01/2024",
  monthStats: { total: 142, onTime: 138, late: 4, trend: "+8% vs anterior" },
  totalStats: { total: 1245, onTime: 1200, late: 45 }
};

const historyData = [
  { id: 1, initials: "MS", name: "Maria Silva", email: "maria.silva@email.com", theme: "Mobilidade Urbana no Século XXI", axis: "MEIO AMBIENTE & CIDADE", score: "920", status: "Corrigida", statusColor: "text-emerald-600 bg-emerald-50", onTime: true, date: "09 Out 2023", time: "14:30h" },
  { id: 2, initials: "JO", name: "João Oliveira", email: "joao.oliveira@email.com", theme: "Desafios da IA no Mercado de Trabalho", axis: "TECNOLOGIA & INOVAÇÃO", score: "760", status: "Devolvida", statusColor: "text-amber-600 bg-amber-50", onTime: false, date: "09 Out 2023", time: "10:15h" },
  { id: 3, initials: "AL", name: "Ana Lima", email: "ana.lima@email.com", theme: "Preservação dos Biomas Brasileiros", axis: "MEIO AMBIENTE", score: "880", status: "Em correção", statusColor: "text-blue-600 bg-blue-50", onTime: true, date: "08 Out 2023", time: "16:45h" },
];

export default function TeacherProfilePage() {
  return (
    <div className="min-h-screen bg-slate-50/50 p-4 md:p-8 font-sans text-slate-900">
      <div className="max-w-[1200px] mx-auto space-y-6">

        {/* =========================================
            BREADCRUMB
        ========================================= */}
        <div className="flex items-center gap-2 text-sm font-bold text-slate-500">
          <Link href="/admin/professores" className="hover:text-blue-600 transition-colors">Gestão de Professores</Link>
          <ChevronRight className="size-4" />
          <span className="text-blue-600">Histórico Detalhado</span>
        </div>

        {/* =========================================
            CABEÇALHO / PERFIL DO PROFESSOR
        ========================================= */}
        <div className="bg-white border border-slate-200 rounded-[2rem] shadow-sm overflow-hidden">
          <div className="p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">

            {/* Info */}
            <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
              <div className="size-20 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-2xl font-black shrink-0">
                {profData.initials}
              </div>
              <div className="space-y-1.5">
                <h1 className="text-2xl font-black text-slate-900 leading-none">{profData.name}</h1>
                <p className="text-sm font-medium text-slate-500">{profData.email}</p>
                <div className="flex items-center justify-center md:justify-start gap-3 text-xs font-bold pt-1">
                  <span className="flex items-center text-slate-500">
                    <Lock className="size-3.5 mr-1" /> ID: {profData.id}
                  </span>
                  <span className="text-slate-300">|</span>
                  <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded text-[10px] uppercase tracking-wider">{profData.status}</span>
                  <span className="text-slate-300">|</span>
                  <span className="text-slate-500">Desde: {profData.since}</span>
                </div>
              </div>
            </div>

            {/* Ações */}
            <div className="flex items-center gap-3 w-full md:w-auto">
              <Button variant="outline" className="flex-1 md:flex-none h-11 rounded-full border-blue-200 text-blue-600 hover:bg-blue-50 font-bold px-6 transition-colors">
                <Pencil className="size-4 mr-2" /> Editar Perfil
              </Button>
              <Button variant="outline" className="flex-1 md:flex-none h-11 rounded-full border-slate-200 text-slate-600 hover:bg-slate-50 font-bold px-6 transition-colors">
                <Lock className="size-4 mr-2" /> Bloquear
              </Button>
            </div>
          </div>

          {/* Link Faturas */}
          <div className="border-t border-slate-100 bg-slate-100 p-4 px-8">
            <button className="flex items-center justify-between w-full text-sm font-bold hover:text-blue-600 transition-colors group">
              <span className="flex items-center gap-2">
                <CreditCard className="size-4 text-slate-400 group-hover:text-blue-600" />
                Gerenciar Pagamentos e Faturas
              </span>
              <ChevronRight className="size-4 text-slate-400 group-hover:text-blue-600" />
            </button>
          </div>
        </div>

        {/* =========================================
            CARDS DE ESTATÍSTICAS (MÊS E TOTAL)
        ========================================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Mês Corrente */}
          <div className="bg-white border border-slate-200 rounded-[2rem] p-6 md:p-8 shadow-sm">
            <div className="flex items-start justify-between mb-4">
              <div className="size-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Calendar className="size-5" />
              </div>
              <span className="bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase px-3 py-1.5 rounded-full tracking-wider">
                {profData.monthStats.trend}
              </span>
            </div>
            <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1">Mês Corrente (Outubro)</h3>
            <div className="flex items-baseline gap-2 mb-6">
              <span className="text-4xl font-black text-slate-900">{profData.monthStats.total}</span>
              <span className="text-sm font-bold text-slate-400">redações corrigidas</span>
            </div>

            {/* Barra de Progresso Customizada */}
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] font-black uppercase tracking-wider">
                <span className="text-emerald-500">{profData.monthStats.onTime} No Prazo</span>
                <span className="text-red-500">{profData.monthStats.late} Em Atraso</span>
              </div>
              <div className="h-2 w-full flex rounded-full overflow-hidden bg-slate-100">
                <div className="bg-emerald-500 h-full" style={{ width: '97%' }}></div>
                <div className="bg-red-500 h-full" style={{ width: '3%' }}></div>
              </div>
            </div>
          </div>

          {/* Total Acumulado */}
          <div className="bg-white border border-slate-200 rounded-[2rem] p-6 md:p-8 shadow-sm">
            <div className="flex items-start justify-between mb-4">
              <div className="size-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <BarChart2 className="size-5" />
              </div>
              <span className="bg-slate-100 text-slate-600 text-[10px] font-black uppercase px-3 py-1.5 rounded-full tracking-wider">
                Histórico Geral
              </span>
            </div>
            <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Acumulado</h3>
            <div className="flex items-baseline gap-2 mb-6">
              <span className="text-4xl font-black text-slate-900">{profData.totalStats.total.toLocaleString()}</span>
              <span className="text-sm font-bold text-slate-400">correções realizadas</span>
            </div>

            {/* Barra de Progresso Customizada */}
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] font-black uppercase tracking-wider">
                <span className="text-emerald-500">{profData.totalStats.onTime.toLocaleString()} No Prazo</span>
                <span className="text-red-500">{profData.totalStats.late} Em Atraso</span>
              </div>
              <div className="h-2 w-full flex rounded-full overflow-hidden bg-slate-100">
                <div className="bg-emerald-500 h-full" style={{ width: '96%' }}></div>
                <div className="bg-red-500 h-full" style={{ width: '4%' }}></div>
              </div>
            </div>
          </div>

        </div>

        {/* =========================================
            GRÁFICOS (MOCKS VISUAIS SVG)
        ========================================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Gráfico 1: Evolução Média */}
          <div className="bg-white border border-slate-200 rounded-[2rem] p-6 md:p-8 shadow-sm">
            <div className="flex items-start justify-between mb-8">
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">Evolução da média atribuída</h3>
                <p className="text-[10px] font-bold text-slate-400 mt-0.5">Média das notas dadas pelo professor</p>
              </div>
              <div className="flex items-center bg-slate-100 p-1 rounded-full">
                <button className="px-3 py-1 rounded-full text-[10px] font-black bg-white text-blue-600 shadow-sm uppercase tracking-wider">7 Dias</button>
                <button className="px-3 py-1 rounded-full text-[10px] font-black text-slate-500 uppercase tracking-wider">30 Dias</button>
                <button className="px-3 py-1 rounded-full text-[10px] font-black text-slate-500 uppercase tracking-wider">6 Meses</button>
              </div>
            </div>

            {/* Mock do Gráfico (SVG Line Chart) */}
            <div className="relative h-40 w-full border-b border-dashed border-slate-200">
              <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none" viewBox="0 0 100 100">
                <polyline
                  points="0,80 15,85 30,60 45,70 60,40 75,50 90,20 100,25"
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="flex justify-between mt-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              <span>Seg</span><span>Ter</span><span>Qua</span><span>Qui</span><span>Sex</span><span>Sáb</span><span>Dom</span>
            </div>
          </div>

          {/* Gráfico 2: Tempo Médio */}
          <div className="bg-white border border-slate-200 rounded-[2rem] p-6 md:p-8 shadow-sm">
            <div className="flex items-start justify-between mb-8">
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">Evolução do tempo médio</h3>
                <p className="text-[10px] font-bold text-slate-400 mt-0.5">Tempo médio de correção (horas)</p>
              </div>
              <div className="flex items-center bg-slate-100 p-1 rounded-full">
                <button className="px-3 py-1 rounded-full text-[10px] font-black bg-white text-amber-500 shadow-sm uppercase tracking-wider">7 Dias</button>
                <button className="px-3 py-1 rounded-full text-[10px] font-black text-slate-500 uppercase tracking-wider">30 Dias</button>
                <button className="px-3 py-1 rounded-full text-[10px] font-black text-slate-500 uppercase tracking-wider">6 Meses</button>
              </div>
            </div>

            {/* Mock do Gráfico (SVG Line Chart) */}
            <div className="relative h-40 w-full border-b border-dashed border-slate-200">
              <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none" viewBox="0 0 100 100">
                <polyline
                  points="0,50 15,40 30,55 45,60 60,80 75,70 90,85 100,80"
                  fill="none"
                  stroke="#eab308"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="flex justify-between mt-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              <span>Seg</span><span>Ter</span><span>Qua</span><span>Qui</span><span>Sex</span><span>Sáb</span><span>Dom</span>
            </div>
          </div>

        </div>

        {/* =========================================
            TABELA: HISTÓRICO DE CORREÇÕES
        ========================================= */}
        <div className="bg-white border border-slate-200 rounded-[2rem] p-6 md:p-8 shadow-sm overflow-hidden">

          {/* Header da Tabela */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-4">
              <div className="size-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <FileText className="size-5" />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900">Histórico de correções</h2>
                <p className="text-xs font-bold text-slate-500">Auditagem detalhada de todas as redações processadas por este professor.</p>
              </div>
            </div>
            <Button className="h-11 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 shadow-sm w-full md:w-auto">
              Exportar Relatório
            </Button>
          </div>

          {/* Filtros da Tabela */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 bg-slate-50/50 rounded-2xl border border-slate-100 mb-6">
            <div className="md:col-span-4 relative">
              <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Pesquisar por aluno ou registro</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                <input type="text" placeholder="Buscar por nome, e-mail ou ID..." className="w-full h-10 pl-9 pr-4 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/50 outline-none" />
              </div>
            </div>
            <div className="md:col-span-3">
              <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Data</label>
              <input type="date" className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 focus:ring-2 focus:ring-blue-500/50 outline-none" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</label>
              <select className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm font-bold text-slate-600 focus:ring-2 focus:ring-blue-500/50 outline-none">
                <option>Todos os Status</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Entrega</label>
              <select className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm font-bold text-slate-600 focus:ring-2 focus:ring-blue-500/50 outline-none">
                <option>Todas as Entregas</option>
              </select>
            </div>
            <div className="md:col-span-1 flex items-end justify-center">
              <button className="size-10 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
                <X className="size-4" />
              </button>
            </div>
          </div>

          {/* Grid da Tabela */}
          <div className="w-full">
            <div className="hidden lg:grid grid-cols-12 gap-4 px-4 py-3 border-b border-slate-100">
              <div className="col-span-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Aluno</div>
              <div className="col-span-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tema / Eixo</div>
              <div className="col-span-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Nota</div>
              <div className="col-span-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Status</div>
              <div className="col-span-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Entrega</div>
              <div className="col-span-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Data</div>
              <div className="col-span-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Ações</div>
            </div>

            <div className="divide-y divide-slate-100">
              {historyData.map((row) => (
                <div key={row.id} className="grid grid-cols-1 lg:grid-cols-12 gap-4 py-4 lg:px-4 items-center hover:bg-slate-50/50 transition-colors group">

                  {/* Aluno */}
                  <div className="col-span-1 lg:col-span-3 flex items-center gap-3">
                    <div className="size-9 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs shrink-0">
                      {row.initials}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-blue-600 hover:underline cursor-pointer leading-tight">{row.name}</p>
                      <p className="text-[11px] font-medium text-slate-400">{row.email}</p>
                    </div>
                  </div>

                  {/* Tema / Eixo */}
                  <div className="col-span-1 lg:col-span-3">
                    <p className="font-bold text-sm text-slate-900 leading-snug truncate" title={row.theme}>{row.theme}</p>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{row.axis}</p>
                  </div>

                  {/* Nota */}
                  <div className="col-span-1 lg:col-span-1 flex justify-between lg:justify-center items-center">
                    <span className="lg:hidden text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nota</span>
                    <span className="text-base font-black text-slate-900">{row.score}</span>
                  </div>

                  {/* Status */}
                  <div className="col-span-1 lg:col-span-2 flex justify-between lg:justify-center items-center">
                    <span className="lg:hidden text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</span>
                    <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${row.statusColor}`}>
                      {row.status}
                    </span>
                  </div>

                  {/* Entrega */}
                  <div className="col-span-1 lg:col-span-1 flex justify-between lg:justify-center items-center">
                    <span className="lg:hidden text-[10px] font-bold text-slate-400 uppercase tracking-widest">Entrega</span>
                    {row.onTime ? (
                      <div className="size-6 rounded-full bg-emerald-50 flex items-center justify-center"><CheckCircle2 className="size-4 text-emerald-500" /></div>
                    ) : (
                      <div className="size-6 rounded-full bg-red-50 flex items-center justify-center"><AlertCircle className="size-4 text-red-500" /></div>
                    )}
                  </div>

                  {/* Data */}
                  <div className="col-span-1 lg:col-span-1 flex justify-between lg:block">
                    <span className="lg:hidden text-[10px] font-bold text-slate-400 uppercase tracking-widest">Data</span>
                    <div className="text-right lg:text-left">
                      <p className="text-xs font-black text-slate-700">{row.date}</p>
                      <p className="text-[10px] font-medium text-slate-400 mt-0.5">{row.time}</p>
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="col-span-1 lg:col-span-1 flex justify-end">
                    <button className="size-8 rounded-full border border-slate-200 text-blue-600 hover:bg-blue-50 flex items-center justify-center transition-colors">
                      <ArrowRight className="size-4" />
                    </button>
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