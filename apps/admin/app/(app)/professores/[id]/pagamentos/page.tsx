import Link from "next/link";
import {
  ChevronRight,
  Calendar,
  Search,
  Eye,
  FileText,
  Download,
  ChevronLeft,
  Banknote,
  IdCard,
  Landmark,
  User
} from "lucide-react";
import { Button } from "@repo/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@repo/ui/components/dialog";
import { ManageAccountsModal } from "@/components/manage-accounts-modal";

// Mocks baseados no Figma
const paymentHistory = [
  { id: 1, date: "10 Out, 2023", period: "01 Set - 30 Set", qty: 245, total: "R$ 2.450,00", status: "Pago", statusColor: "bg-emerald-50 text-emerald-600", hasReceipt: true },
  { id: 2, date: "12 Set, 2023", period: "01 Ago - 31 Ago", qty: 198, total: "R$ 1.980,00", status: "Pago", statusColor: "bg-emerald-50 text-emerald-600", hasReceipt: true },
  { id: 3, date: "-", period: "01 Out - 09 Out", qty: 187, total: "R$ 1.870,00", status: "Pendente", statusColor: "bg-amber-50 text-amber-600", hasReceipt: false },
];

const modalEssays = [
  { id: 1, student: "Ana Beatriz Silva", avatar: "https://i.pravatar.cc/150?u=ana", title: "A Importância da Educação no Século XXI", subDate: "12/10/2023", corDate: "15/10/2023", score: "960", status: "No Prazo" },
  { id: 2, student: "Lucas Ferreira", avatar: "https://i.pravatar.cc/150?u=lucas", title: "Impactos da Inteligência Artificial", subDate: "14/10/2023", corDate: "20/10/2023", score: "880", status: "Atrasado" },
  { id: 3, student: "Mariana Santos", avatar: "https://i.pravatar.cc/150?u=mariana", title: "Sustentabilidade Urbana no Brasil", subDate: "18/10/2023", corDate: "22/10/2023", score: "920", status: "No Prazo" },
];

export default function TeacherPaymentsPage() {
  return (
    <div className="min-h-dvh bg-slate-50/50 p-4 md:p-8 font-sans text-slate-900">
      <div className="max-w-[1200px] mx-auto space-y-6">
        {/* =========================================
            CABEÇALHO DO PROFESSOR (Substituindo o Breadcrumb)
        ========================================= */}
        <div className="bg-white border border-slate-200 rounded-[2rem] p-6 md:p-8 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">

          {/* Info do Professor */}
          <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
            <div className="size-20 rounded-full bg-[#fef3c7] text-[#b45309] flex items-center justify-center text-2xl font-black shrink-0">
              CA
            </div>
            <div className="space-y-1.5">
              <h1 className="text-2xl font-black text-slate-900 leading-none">Carlos Andrade</h1>
              <p className="text-sm font-medium text-slate-500">carlos.andrade@email.com</p>

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-xs font-bold pt-2">
                <span className="flex items-center text-slate-500">
                  <IdCard className="size-4 mr-1.5" /> ID: #PROF-2024-89
                </span>
                <span className="text-slate-300">|</span>
                <span className="text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full text-[10px] uppercase font-black tracking-wider">
                  Ativo
                </span>
                <span className="text-slate-300">|</span>
                <span className="text-slate-500">Desde: 15/01/2024</span>
              </div>
            </div>
          </div>

          {/* Ação (Modificada) */}
          {/* <div className="w-full md:w-auto">
            <Button variant="outline" className="w-full md:w-auto h-11 rounded-full border-blue-200 text-blue-600 hover:bg-blue-50 font-bold px-6 transition-colors">
              <Landmark className="size-4 mr-2" /> Gerenciar contas de pagamento
            </Button>
          </div> */}

          <div className="w-full md:w-auto">
            <ManageAccountsModal />
          </div>
        </div>

        {/* =========================================
            BARRA DE FILTROS DE PERÍODO
        ========================================= */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">

          {/* Inputs de Data */}
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest shrink-0">De</span>
            <div className="relative w-full sm:w-auto">
              <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
              <input type="text" defaultValue="10/09/2023" className="w-full sm:w-36 h-10 pl-3 pr-10 rounded-lg border border-slate-200 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500/50 outline-none" />
            </div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest shrink-0">até</span>
            <div className="relative w-full sm:w-auto">
              <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
              <input type="text" defaultValue="09/10/2023" className="w-full sm:w-36 h-10 pl-3 pr-10 rounded-lg border border-slate-200 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500/50 outline-none" />
            </div>
            <Button size="icon" className="h-10 w-10 shrink-0 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm">
              <Search className="size-4" />
            </Button>
          </div>

          {/* Filtros Rápidos (Pills) */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 xl:pb-0 w-full xl:w-auto">
            <button className="px-4 py-2 rounded-full text-xs font-bold bg-amber-100 text-amber-700 whitespace-nowrap">Período Atual (30 dias)</button>
            <button className="px-4 py-2 rounded-full text-xs font-bold bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 whitespace-nowrap">Mês Anterior</button>
            <button className="px-4 py-2 rounded-full text-xs font-bold bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 whitespace-nowrap">60 dias</button>
            <button className="px-4 py-2 rounded-full text-xs font-bold bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 whitespace-nowrap">90 dias</button>
            <button className="px-4 py-2 rounded-full text-xs font-bold bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 whitespace-nowrap">180 dias</button>
          </div>
        </div>

        {/* =========================================
            CARDS: MÉTRICAS E FATURAMENTO (UNIFICADO)
        ========================================= */}
        {(() => {
          // Mude para `true` para ver o layout de Mês Pago (Verde/Azul)
          // Mude para `false` para ver o layout de Mês Pendente (Amarelo)
          const isPaid = false;

          return (
            <div className="bg-white border border-slate-200 rounded-[2rem] shadow-sm grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100 overflow-hidden">

              {/* LADO ESQUERDO: Redações no Período (Fixo) */}
              <div className="p-6 md:p-8 flex flex-col justify-between h-full">
                <div>
                  <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-4">Redações no Período</h3>

                  <div className="flex items-baseline gap-2 mb-4">
                    <span className="text-5xl font-black text-slate-900">187</span>
                    <span className="text-sm font-medium text-slate-500">correções</span>
                  </div>

                  {/* Badges de Prazo */}
                  <div className="flex items-center gap-3 text-xs font-bold mb-6">
                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600">
                      <span className="size-1.5 rounded-full bg-emerald-500"></span> 185 no prazo
                    </span>
                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-red-500">
                      <span className="size-1.5 rounded-full bg-red-500"></span> 2 atrasadas
                    </span>
                  </div>

                  <div className="h-px w-full bg-slate-100 mb-6" />

                  {/* Valores base */}
                  <div className="grid grid-cols-2 gap-4 mb-8">
                    <div>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Valor por Correção</p>
                      <p className="text-xl font-black text-slate-900">R$ 10,00</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Média Diária</p>
                      <p className="text-xl font-black text-slate-900">6.2</p>
                    </div>
                  </div>
                </div>

                {/* <Button variant="outline" className="w-full h-12 rounded-xl border-blue-600 text-blue-600 hover:bg-blue-50 font-bold transition-colors">
                  <Eye className="size-4 mr-2" /> Ver redações do período selecionado
                </Button> */}

                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full h-12 rounded-xl border-blue-600 text-blue-600 hover:bg-blue-50 font-bold transition-colors">
                      <Eye className="size-4 mr-2" /> Ver redações do período selecionado
                    </Button>
                  </DialogTrigger>

                  <DialogContent className="max-w-4xl p-0 overflow-hidden rounded-[2rem] border-none shadow-2xl bg-white">

                    {/* Cabeçalho do Modal */}
                    <DialogHeader className="p-6 md:p-8 pb-0 text-left">
                      <DialogTitle className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
                        Redações no Período: 10/10/2023 a 09/11/2023
                      </DialogTitle>
                      <div className="flex items-center gap-2 mt-1 text-xs font-bold text-slate-500">
                        <User className="size-3.5 text-blue-600" />
                        Professor Selecionado: <span className="font-medium text-slate-400">Carlos Andrade</span>
                      </div>
                    </DialogHeader>

                    <div className="p-6 md:p-8 pt-6 space-y-6">

                      {/* Busca e Filtros */}
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="relative w-full md:max-w-md">
                          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                          <input
                            type="text"
                            placeholder="Buscar por nome do aluno ou status..."
                            className="w-full h-11 pl-11 pr-4 rounded-full border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-blue-500/50 outline-none transition-all placeholder:text-slate-400"
                          />
                        </div>
                        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
                          <button className="px-4 py-1.5 rounded-full text-xs font-bold bg-blue-50 text-blue-600 whitespace-nowrap">Todos</button>
                          <button className="px-4 py-1.5 rounded-full text-xs font-bold border border-slate-200 text-slate-500 hover:bg-slate-50 whitespace-nowrap">No Prazo</button>
                          <button className="px-4 py-1.5 rounded-full text-xs font-bold border border-slate-200 text-slate-500 hover:bg-slate-50 whitespace-nowrap">Atrasado</button>
                        </div>
                      </div>

                      {/* Tabela do Modal */}
                      <div className="w-full overflow-x-auto">
                        <div className="min-w-[800px]">
                          {/* Header da Tabela */}
                          <div className="grid grid-cols-12 gap-4 pb-3 border-b border-slate-100">
                            <div className="col-span-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Aluno</div>
                            <div className="col-span-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Título da Redação</div>
                            <div className="col-span-1 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Submissão</div>
                            <div className="col-span-1 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Correção</div>
                            <div className="col-span-1 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Nota</div>
                            <div className="col-span-2 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Status</div>
                          </div>

                          {/* Linhas da Tabela */}
                          <div className="divide-y divide-slate-50">
                            {modalEssays.map((essay) => (
                              <div key={essay.id} className="grid grid-cols-12 gap-4 py-4 items-center hover:bg-slate-50/50 transition-colors">

                                <div className="col-span-3 flex items-center gap-3">
                                  <img src={essay.avatar} alt={essay.student} className="size-8 rounded-full object-cover" />
                                  <span className="font-bold text-xs text-slate-900">{essay.student}</span>
                                </div>

                                <div className="col-span-4">
                                  <span className="text-xs font-medium italic text-slate-600">{essay.title}</span>
                                </div>

                                <div className="col-span-1 text-center">
                                  <span className="text-[11px] font-medium text-slate-500">{essay.subDate}</span>
                                </div>

                                <div className="col-span-1 text-center">
                                  <span className="text-[11px] font-medium text-slate-500">{essay.corDate}</span>
                                </div>

                                <div className="col-span-1 text-center">
                                  <span className="text-[13px] font-black text-amber-500">{essay.score}</span>
                                </div>

                                <div className="col-span-2 flex justify-end">
                                  <span className={`inline-flex px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${essay.status === 'No Prazo' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'
                                    }`}>
                                    {essay.status}
                                  </span>
                                </div>

                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Rodapé do Modal */}
                    <div className="bg-slate-50 border-t border-slate-100 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-6">
                        <span className="text-xs font-bold text-slate-500">
                          Total de Redações: <span className="text-blue-600 font-black">187</span>
                        </span>
                        <span className="text-xs font-bold text-slate-500">
                          Média do Período: <span className="text-amber-500 font-black">912</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-3 w-full sm:w-auto">
                        <Button variant="outline" className="flex-1 sm:flex-none rounded-full h-10 px-6 font-bold text-slate-600 hover:bg-slate-100 border-slate-200">
                          <Download className="size-4 mr-2" /> Exportar CSV
                        </Button>
                        <DialogTrigger asChild>
                          <Button className="flex-1 sm:flex-none rounded-full h-10 px-8 font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
                            Concluir
                          </Button>
                        </DialogTrigger>
                      </div>
                    </div>

                  </DialogContent>
                </Dialog>
              </div>

              {/* LADO DIREITO: Resumo de Faturamento (Dinâmico: Pendente vs Pago) */}
              <div className="p-6 md:p-8 flex flex-col justify-center h-full">

                {/* Header dinâmico baseado no status */}
                <div className={`flex items-start justify-between ${isPaid ? 'mb-8' : 'mb-8'}`}>
                  <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-widest mt-1">Resumo de Faturamento</h3>
                  {!isPaid && (
                    <span className="bg-[#fef3c7] text-[#b45309] text-[10px] font-black uppercase px-3 py-1.5 rounded-full tracking-wider">
                      Pendente
                    </span>
                  )}
                </div>

                {/* Linha de Totais */}
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-slate-500">
                      {isPaid ? "Total Pago" : "Total a Pagar"}
                    </span>
                    {isPaid && (
                      <span className="bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase px-3 py-1.5 rounded-full tracking-wider">
                        Pago
                      </span>
                    )}
                  </div>
                  <span className="text-4xl font-black text-[#C47E3A]">R$ 1.870,00</span>
                </div>

                {/* Barra grossa colorida */}
                <div className={`h-2.5 w-full rounded-full mb-8 ${isPaid ? 'bg-emerald-500' : 'bg-[#F4C042]'}`} />

                {/* Botão Dinâmico */}
                {isPaid ? (
                  <Button className="w-full h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-sm">
                    <FileText className="size-5 mr-2" /> Ver Comprovante de Pagamento
                  </Button>
                ) : (
                  <Button className="w-full h-14 rounded-2xl bg-[#F4C042] hover:bg-[#eab308] text-amber-950 font-black text-sm shadow-sm">
                    <Banknote className="size-5 mr-2" /> Registrar Pagamento Manual
                  </Button>
                )}

              </div>

            </div>
          );
        })()}

        {/* =========================================
            TABELA: HISTÓRICO DE PAGAMENTOS
        ========================================= */}
        <div className="bg-white border border-slate-200 rounded-[2rem] p-6 md:p-8 shadow-sm overflow-hidden">

          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-black text-slate-900">Histórico de Pagamentos</h2>
            <Button variant="ghost" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-bold px-4 h-10">
              <Download className="size-4 mr-2" /> Exportar CSV
            </Button>
          </div>

          <div className="w-full">
            {/* Header da Tabela */}
            <div className="hidden lg:grid grid-cols-12 gap-4 px-4 py-4 border-b border-slate-100">
              <div className="col-span-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Data do Pagamento</div>
              <div className="col-span-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Período de Referência</div>
              <div className="col-span-2 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Qtd. Redações</div>
              <div className="col-span-2 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Valor Total</div>
              <div className="col-span-1 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</div>
              <div className="col-span-2 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Comprovante</div>
            </div>

            {/* Corpo da Tabela */}
            <div className="divide-y divide-slate-100">
              {paymentHistory.map((row) => (
                <div key={row.id} className="grid grid-cols-1 lg:grid-cols-12 gap-4 py-5 lg:px-4 items-center hover:bg-slate-50/50 transition-colors group">

                  {/* Data */}
                  <div className="col-span-1 lg:col-span-2 flex justify-between lg:block">
                    <span className="lg:hidden text-[10px] font-black text-slate-400 uppercase tracking-widest">Data</span>
                    <span className="text-sm font-bold text-slate-900">{row.date}</span>
                  </div>

                  {/* Período */}
                  <div className="col-span-1 lg:col-span-3 flex justify-between lg:block">
                    <span className="lg:hidden text-[10px] font-black text-slate-400 uppercase tracking-widest">Período</span>
                    <span className="text-sm font-medium text-slate-500">{row.period}</span>
                  </div>

                  {/* Qtd Redações */}
                  <div className="col-span-1 lg:col-span-2 flex justify-between lg:justify-center items-center">
                    <span className="lg:hidden text-[10px] font-black text-slate-400 uppercase tracking-widest">Qtd. Redações</span>
                    <span className="text-sm font-bold text-slate-900">{row.qty}</span>
                  </div>

                  {/* Valor Total */}
                  <div className="col-span-1 lg:col-span-2 flex justify-between lg:justify-end items-center">
                    <span className="lg:hidden text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor Total</span>
                    <span className="text-sm font-black text-slate-900">{row.total}</span>
                  </div>

                  {/* Status */}
                  <div className="col-span-1 lg:col-span-1 flex justify-between lg:justify-center items-center">
                    <span className="lg:hidden text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</span>
                    <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${row.statusColor}`}>
                      {row.status}
                    </span>
                  </div>

                  {/* Comprovante */}
                  <div className="col-span-1 lg:col-span-2 flex justify-end mt-2 lg:mt-0 pt-4 lg:pt-0 border-t border-slate-100 lg:border-t-0">
                    {row.hasReceipt ? (
                      <Button variant="ghost" size="icon" className="text-blue-600 hover:bg-blue-50" title="Ver Comprovante">
                        <FileText className="size-5" />
                      </Button>
                    ) : (
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider py-2">Aguardando</span>
                    )}
                  </div>

                </div>
              ))}
            </div>

            {/* Paginação */}
            <div className="pt-6 mt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400">Mostrando 3 de 24 pagamentos</span>
              <div className="flex items-center gap-1">
                <button className="size-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-colors">
                  <ChevronLeft className="size-4" />
                </button>
                <button className="size-8 flex items-center justify-center rounded-full bg-slate-900 text-white font-bold shadow-sm">
                  1
                </button>
                <button className="size-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-colors">
                  <ChevronRight className="size-4" />
                </button>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}