
import { Button } from "@repo/ui/components/button";
import { Avatar } from "@repo/ui/components/avatar";
interface StudentProfileHeaderProps {
  student: {
    name: string;
    id: string;
    registrationDate: string;
    email: string;
    avatarUrl: string;
    plan: {
      status: string;
      name: string;
      expiresAt: string;
    };
    credits: {
      professor: number;
      ia: number;
    };
  };
}

export function StudentProfileHeader({ student }: StudentProfileHeaderProps) {
  return (
    <div className="bg-white rounded-4xl shadow-sm border border-slate-200 overflow-hidden">

      <div className="p-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
          <Avatar src={student.avatarUrl} name={student.name} className="size-20 rounded-full" />
          <div>
            <h1 className="text-2xl font-black text-slate-900">{student.name}</h1>
            <p className="text-sm font-medium text-slate-500 mt-1">
              ID: #{student.id} • Data de Cadastro: {student.registrationDate}
            </p>
            <p className="text-sm font-bold text-blue-600 mt-1">{student.email}</p>
          </div>
        </div>
        <div>
          <Button className="font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-full h-10 px-6 shadow-sm w-full md:w-auto">
            Editar dados
          </Button>
        </div>
      </div>

      <div className="h-px bg-slate-200 w-full" />

      <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-200">

        <div className="p-8 flex flex-col items-center justify-center text-center bg-slate-100">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Dados da Assinatura</h3>
          <div className="flex items-center gap-2 mb-2">
            <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-md tracking-wider ${student.plan.status === "ATIVO" ? "bg-emerald-50 text-emerald-600" :
              student.plan.status === "BLOQUEADO" ? "bg-red-50 text-red-600" :
                "bg-slate-200 text-slate-600"
              }`}>
              {student.plan.status}
            </span>
            <span className="font-black text-slate-900 text-lg">{student.plan.name}</span>
          </div>
          <p className="text-sm font-medium text-slate-500">
            Expira em: <span className="font-bold text-slate-900">{student.plan.expiresAt}</span>
          </p>
        </div>

        <div className="p-8 flex flex-col items-center justify-center bg-slate-100">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Créditos Professor</h3>
          <div className="size-20 rounded-full border-[6px] border-amber-200/40 flex items-center justify-center">
            <span className="text-3xl font-black text-amber-400">{student.credits.professor}</span>
          </div>
        </div>

        <div className="p-8 flex flex-col items-center justify-center bg-slate-100">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Créditos IA</h3>
          <div className="size-20 rounded-full border-[6px] border-blue-100 flex items-center justify-center">
            <span className="text-3xl font-black text-blue-600">{student.credits.ia}</span>
          </div>
        </div>
      </div>
    </div>
  );
}