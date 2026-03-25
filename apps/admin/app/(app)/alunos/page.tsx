import { getStudentsCount, getStudentsList } from "@/app/action/get-students-data";
import { ExportCsvButton } from "@/components/export-csv-button";
import { StudentTable } from "@/components/student-table";
import { Button } from "@repo/ui/components/button";
import { Plus } from "lucide-react";

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = await searchParams;

  const filters = {
    search: typeof resolvedParams?.search === 'string' ? resolvedParams.search : undefined,
    status: typeof resolvedParams?.status === 'string' ? resolvedParams.status : undefined,
    from: typeof resolvedParams?.from === 'string' ? resolvedParams.from : undefined,
    to: typeof resolvedParams?.to === 'string' ? resolvedParams.to : undefined,
  };

  const page = Number(resolvedParams?.page) || 1;

  const perPage = 10

  const [totalCount, studentsResponse] = await Promise.all([
    getStudentsCount(),
    getStudentsList(filters, page, perPage)
  ]);

  const { data: studentList, totalPages } = studentsResponse;

  return (
    <div className="min-h-screen px-4 md:px-10 lg:px-12 py-4 space-y-8">

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight mb-2">
            Gerenciamento de Alunos
          </h2>
          <p className="text-slate-500">
            Base de dados central: <span className="font-bold text-secondary">{totalCount} alunos</span> cadastrados
          </p>
        </div>
        <div className="flex items-center gap-3">

          <ExportCsvButton filters={filters} />

          <Button className="font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-10 shadow-sm">
            <Plus className="size-4 mr-2" />
            Novo Aluno
          </Button>
        </div>
      </div>

      <StudentTable students={studentList} totalPages={totalPages} />
    </div>
  );
}