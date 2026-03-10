import { Button } from "@repo/ui/components/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@repo/ui/components/tooltip";
import { Bot, ChevronDown, Eye, Plus, Search, Upload, User, UserCheck, UserX } from "lucide-react";

// Mocks de dados baseados na imagem
const studentsData = [
  {
    id: "1",
    initials: "JS",
    name: "João Silva",
    email: "joao.silva@email.com",
    status: "ATIVO",
    plan: "Premium",
    creditsProf: 5,
    creditsIA: 12,
    validityStart: "12/01/2023",
    validityEnd: "12/01/2024",
    validityType: "RENOVAÇÃO AUTOMÁTICA",
    avatarBg: "bg-blue-50 text-blue-600"
  },
  {
    id: "2",
    initials: "MO",
    name: "Maria Oliveira",
    email: "maria.oliveira@email.com",
    status: "ATIVO",
    plan: "Pro",
    creditsProf: 2,
    creditsIA: 5,
    validityStart: "05/02/2023",
    validityEnd: "05/02/2024",
    validityType: "MANUAL",
    avatarBg: "bg-purple-50 text-purple-600"
  },
  {
    id: "3",
    initials: "CS",
    name: "Carlos Souza",
    email: "carlos.souza@email.com",
    status: "INATIVO",
    plan: "Basic",
    creditsProf: 0,
    creditsIA: 0,
    validityStart: "10/11/2022",
    validityEnd: "10/11/2023",
    validityType: "EXPIRADO",
    avatarBg: "bg-amber-50 text-amber-600"
  }
];

export default function ManageStudentsPage() {
  return (
    <div className="min-h-screen px-4 md:px-10 lg:px-12 py-4 space-y-8">

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight mb-2">
            Gerenciamento de Alunos
          </h2>
          <p className="text-slate-500">
            Base de dados central: <span className="font-bold text-secondary">1.240 alunos</span> cadastrados
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="font-bold text-slate-700 bg-white border-slate-200 hover:bg-slate-50 rounded-xl h-10 ">
            <Upload className="size-4 mr-2" />
            Exportar CSV
          </Button>
          <Button className="font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-10  shadow-sm">
            <Plus className="size-4 mr-2" />
            Novo Aluno
          </Button>
        </div>
      </div>

      {/* Filtro */}
      <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-200 mb-8 flex flex-col lg:flex-row items-center gap-2">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nome, e-mail ou CPF..."
            className="w-full h-12 pl-11 pr-4 rounded-xl text-sm text-slate-700 bg-slate-50 border-none outline-none focus:ring-2 focus:ring-secondary/70 placeholder:text-slate-400 transition-all"
          // value={searchTerm}
          // onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Filtros Visuais */}

        <div className="flex items-center gap-3 w-full xl:w-auto overflow-x-auto pb-2 xl:pb-0">
          <div className="h-12 flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 cursor-pointer transition-colors shrink-0">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Status:</span>
            <span className="text-sm font-bold text-slate-700 flex items-center gap-1">Todos <ChevronDown className="size-4 text-slate-400" /></span>
          </div>

          <div className="h-12 flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 cursor-pointer transition-colors shrink-0">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Plano:</span>
            <span className="text-sm font-bold text-slate-700 flex items-center gap-1">Todos <ChevronDown className="size-4 text-slate-400" /></span>
          </div>

          <div className="h-12 flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 cursor-pointer transition-colors shrink-0">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Data:</span>
            <span className="text-sm font-bold text-slate-700 flex items-center gap-1">Últimos 30 dias <ChevronDown className="size-4 text-slate-400" /></span>
          </div>

          {/* <div className="w-px h-6 bg-slate-200 mx-1 shrink-0"></div>

          <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors shrink-0">
            <Filter className="size-5" />
          </button> */}
        </div>
      </div>
      {/* TABELA RESPONSIVA COM CSS GRID */}

      <div className="bg-white rounded-4xl shadow-sm border border-slate-200 overflow-hidden">

        {/* Cabeçalho Desktop (Escondido no Mobile) */}
        <div className="hidden lg:grid grid-cols-12 gap-4 px-8 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="col-span-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Aluno</div>
          <div className="col-span-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</div>
          <div className="col-span-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Plano</div>
          <div className="col-span-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Créditos</div>
          <div className="col-span-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Vigência</div>
          <div className="col-span-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Ações</div>
        </div>

        {/* Corpo da Tabela / Cards no Mobile */}
        <div className="divide-y divide-slate-100">
          {studentsData.map((student) => (
            <div
              key={student.id}
              className="grid grid-cols-1 lg:grid-cols-12 gap-4 p-5 lg:px-8 lg:py-4 items-center hover:bg-slate-50/50 transition-colors group"
            >

              {/* Estudante */}
              <div className="col-span-1 lg:col-span-4 flex items-center gap-4">
                <div className={`size-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${student.avatarBg}`}>
                  {student.initials}
                </div>
                <div>
                  <p className="font-bold text-sm text-slate-900 leading-tight">{student.name}</p>
                  <p className="text-xs text-slate-500">{student.email}</p>
                </div>
              </div>

              {/* Status */}
              <div className="col-span-1 lg:col-span-1 flex flex-row lg:flex-col items-center lg:items-start justify-between lg:justify-center mt-2 lg:mt-0">
                <span className="lg:hidden text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</span>
                <span className={`inline-flex px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${student.status === "ATIVO" ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"
                  }`}>
                  {student.status}
                </span>
              </div>

              {/* Plano */}
              <div className="col-span-1 lg:col-span-2 flex flex-row lg:flex-col items-center lg:items-start justify-between lg:justify-center">
                <span className="lg:hidden text-[10px] font-bold text-slate-400 uppercase tracking-widest">Plano</span>
                <span className={`inline-flex px-3 py-1 rounded-full border text-xs font-bold ${student.plan === "Premium" ? "border-blue-200 bg-blue-50 text-blue-700" : "border-slate-200 bg-slate-50 text-slate-600"
                  }`}>
                  {student.plan}
                </span>
              </div>

              {/* Créditos */}
              <div className="col-span-1 lg:col-span-2 flex flex-row lg:flex-col items-center lg:items-start justify-between lg:justify-center">
                <span className="lg:hidden text-[10px] font-bold text-slate-400 uppercase tracking-widest">Créditos</span>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-purple-50 text-purple-700 rounded-md">
                    <User className="size-3.5" />
                    <span className="text-xs font-bold">{student.creditsProf}</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-blue-50 text-blue-700 rounded-md">
                    <Bot className="size-3.5" />
                    <span className="text-xs font-bold">{student.creditsIA}</span>
                  </div>
                </div>
              </div>

              {/* Vigência */}
              <div className="col-span-1 lg:col-span-2 flex flex-row lg:flex-col items-center lg:items-start justify-between lg:justify-center">
                <span className="lg:hidden text-[10px] font-bold text-slate-400 uppercase tracking-widest">Vigência</span>
                <div className="text-right lg:text-left">
                  <p className="text-sm font-bold text-slate-700">
                    {student.validityStart} - {student.validityEnd}
                  </p>
                  <p className={`text-[10px] font-bold uppercase tracking-wider mt-0.5 ${student.validityType === "EXPIRADO" ? "text-red-500" : "text-slate-400"
                    }`}>
                    {student.validityType}
                  </p>
                </div>
              </div>

              {/* Ações */}
              <div className="col-span-1 lg:col-span-1 flex justify-end pt-4 lg:pt-0 mt-2 lg:mt-0 border-t border-slate-100 lg:border-t-0">
                <div className="flex items-center gap-1">

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                      >
                        <Eye className="size-4.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="bg-slate-900 text-white font-medium text-xs rounded-lg border-none">
                      <p>Ver Detalhes</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      >
                        {student.status === "ATIVO" ? <UserX className="size-4.5" /> : <UserCheck className="size-4.5" />}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="bg-slate-900 text-white font-medium text-xs rounded-lg border-none">
                      <p>{student.status === "ATIVO" ? "Bloquear" : "Ativar"}</p>
                    </TooltipContent>
                  </Tooltip>

                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}