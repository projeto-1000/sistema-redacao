import Link from "next/link";
import {
  ChevronRight,
  Search,
  X,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  FileText
} from "lucide-react";
import { Button } from "@repo/ui/components/button";
import { getTeacherById, getTeacherChartsData } from "@/app/action/get-teachers-data";
import { notFound } from "next/navigation";
import TeacherProfileHeader from "@/components/teacher-profile-header";
import TeacherStatsCards from "@/components/teacher-stats-cards";
import ScoreDistributionChart from "@/components/score-distribution-chart";
import AverageTimeCard from "@/components/average-time-card";

const historyData = [
  { id: 1, initials: "MS", name: "Maria Silva", email: "maria.silva@email.com", theme: "Mobilidade Urbana no Século XXI", axis: "MEIO AMBIENTE & CIDADE", score: "920", status: "Corrigida", statusColor: "text-emerald-600 bg-emerald-50", onTime: true, date: "09 Out 2023", time: "14:30h" },
  { id: 2, initials: "JO", name: "João Oliveira", email: "joao.oliveira@email.com", theme: "Desafios da IA no Mercado de Trabalho", axis: "TECNOLOGIA & INOVAÇÃO", score: "760", status: "Devolvida", statusColor: "text-amber-600 bg-amber-50", onTime: false, date: "09 Out 2023", time: "10:15h" },
  { id: 3, initials: "AL", name: "Ana Lima", email: "ana.lima@email.com", theme: "Preservação dos Biomas Brasileiros", axis: "MEIO AMBIENTE", score: "880", status: "Em correção", statusColor: "text-blue-600 bg-blue-50", onTime: true, date: "08 Out 2023", time: "16:45h" },
];

export default async function TeacherProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {

  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const teacherId = resolvedParams.id;

  const teacher = await getTeacherById(teacherId);
  const chartsData = await getTeacherChartsData(resolvedParams.id);

  if (!teacher) {
    notFound();
  }

  const teacherData = {
    name: teacher.full_name,
    id: teacher.id,
    status: teacher.status,
    registrationDate: new Date(teacher.created_at).toLocaleDateString("pt-BR"),
    email: teacher.email,
    avatarUrl: teacher.avatar_url || null,
  }

  return (
    <div className="min-h-screen px-4 md:px-10 lg:px-12 py-4 space-y-8">

      <div className="flex items-center gap-2 text-sm font-bold text-slate-500">
        <Link href="/professores" className="hover:text-blue-600 transition-colors">Gestão de Professores</Link>
        <ChevronRight className="size-4" />
        <span className="text-blue-600">Histórico Detalhado</span>
      </div>

      <TeacherProfileHeader teacher={teacherData} />

      <TeacherStatsCards teacherId={teacherId} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ScoreDistributionChart data={chartsData || []} />

        <AverageTimeCard teacherId={teacherId} />
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
  );
}