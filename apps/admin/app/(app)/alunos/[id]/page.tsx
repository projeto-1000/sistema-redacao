import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getStudentById } from "@/app/actions/students";
import { notFound } from "next/navigation";
import { StudentProfileHeader } from "@/components/student-profile-header";
import { StudentStatsCards } from "@/components/student-stats-cards";
import { StudentEssaysTable } from "@/components/student-essays-table";
import { Button } from "@repo/ui/components/button";
import { parseStudentEssaysFilters } from "@/utils/parse-filters";
import { Suspense } from "react";
import { Skeleton } from "@repo/ui/components/skeleton";
import { ModalWrapper } from "@repo/ui/components/modal-wrapper";
import { GradedEssayView } from "@/components/graded-essay-view";

const creditsHistory = [
  { id: 1, date: "24/05/2024", type: "IA", action: "Uso em Redação", balance: "5 IA", isPositive: false },
  { id: 2, date: "12/05/2024", type: "Professor", action: "Uso em Redação", balance: "10 Professor", isPositive: false },
  { id: 3, date: "01/05/2024", type: "Pacote Plus", action: "Compra", balance: "+15 Prof. | +10 IA", isPositive: true },
];

export default async function StudentProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const studentId = resolvedParams.id;
  const page = Number(resolvedSearchParams?.page) || 1;

  const suspenseKey = JSON.stringify(resolvedParams);

  const filters = parseStudentEssaysFilters(resolvedSearchParams);

  const { student, error } = await getStudentById(studentId);

  if (!student || error) {
    notFound();
  }
  const essayId = resolvedSearchParams?.essayId as string | undefined;

  return (
    <div className="min-h-screen px-4 md:px-10 lg:px-12 pb-8 space-y-10">

      <Button asChild variant='ghost' className="text-slate-500">
        <Link href="/alunos">
          <ArrowLeft className="size-4 mr-2" />
          Voltar para lista de alunos
        </Link>
      </Button>


      <Suspense
        key={suspenseKey}
        fallback={<Skeleton className="rounded-3xl min-h-auto bg-slate-200 mt-6" />}
      >
        <StudentProfileHeader student={student} />
      </Suspense>

      <StudentStatsCards studentId={student.id} />

      <StudentEssaysTable
        studentId={studentId}
        filters={filters}
        page={page}
      />

      {/* <div className="bg-white rounded-4xl shadow-sm border border-slate-200 p-6 md:p-8">
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
      </div> */}
      {essayId && (
        <ModalWrapper
          key={essayId}
          param="essayId"
          title="Visualizar Redação"
        >
          <GradedEssayView essayId={essayId} />
        </ModalWrapper>
      )}
    </div>
  );
}