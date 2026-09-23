import { getStudents } from "@/app/actions/students";
import { CircleAlert, FileText, Search } from "lucide-react";
import { TablePagination } from "@repo/ui/components/table-pagination";
import { Skeleton } from "@repo/ui/components/skeleton";
import { StudentsTableRow } from "./students-table-row";
import { StudentsTableShell } from "./students-table-shell";
import { STUDENTS_TABLE_GRID } from "./students-table-layout";
import { StudentsFilter } from "@repo/types";
import { Suspense } from "react";

interface StudentsTableProps {
  filters: StudentsFilter;
  page: number;
  sort: "created_at" | "full_name" | "status";
  order: "asc" | "desc";
}

export function StudentsTable({ filters, page, sort, order }: StudentsTableProps) {
  const getSortHref = (field: "created_at" | "full_name" | "status") => {
    const nextOrder = sort === field && order === "asc" ? "desc" : "asc";

    const params = new URLSearchParams();

    if (filters?.search) {
      params.set("search", filters.search);
    }

    if (filters?.status && filters.status !== "all") {
      params.set("status", filters.status);
    }

    if (filters?.plan && filters.plan !== "all") {
      params.set("plan", filters.plan);
    }

    if (filters?.from) {
      params.set("from", filters.from);
    }

    if (filters?.to) {
      params.set("to", filters.to);
    }

    params.set("sort", field);
    params.set("order", nextOrder);
    params.set("page", "1");

    return `/alunos?${params.toString()}`;
  };

  const studentsPromise = getStudents({ filters, page, sort, order });
  const suspenseKey = JSON.stringify({ filters, page, sort, order });

  return (
    <StudentsTableShell
      sort={sort}
      order={order}
      sortHrefs={{
        full_name: getSortHref("full_name"),
        created_at: getSortHref("created_at"),
        status: getSortHref("status"),
      }}
      rowsSkeleton={<StudentsTableRowsSkeleton />}
      pagination={
        <Suspense fallback={null}>
          <StudentsTablePagination studentsPromise={studentsPromise} />
        </Suspense>
      }
    >
      <Suspense key={suspenseKey} fallback={<StudentsTableRowsSkeleton />}>
        <StudentsTableRows studentsPromise={studentsPromise} searchTerm={filters?.search} />
      </Suspense>
    </StudentsTableShell>
  );
}

type StudentsResult = Awaited<ReturnType<typeof getStudents>>;

async function StudentsTableRows({
  studentsPromise,
  searchTerm,
}: {
  studentsPromise: Promise<StudentsResult>;
  searchTerm?: string;
}) {
  const { students, error } = await studentsPromise;

  if (error) {
    return (
      <div className="animate-in fade-in flex flex-col items-center justify-center bg-slate-100 px-6 py-24 text-center duration-500">
        <CircleAlert className="mb-4 size-14 rounded-full bg-white p-1 text-red-500 shadow-sm" />
        <h3 className="mb-1 text-lg font-bold text-red-600">Ocorreu um erro.</h3>
        <p className="max-w-sm text-sm leading-relaxed text-slate-600">
          Não conseguimos carregar a lista de alunos. Por favor, recarregue a página ou tente
          novamente em instantes.
        </p>
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <div className="animate-in fade-in flex flex-col items-center justify-center bg-slate-100 px-6 py-24 text-center duration-500">
        <div className="mb-4 rounded-full bg-white p-4 shadow-sm">
          {searchTerm ? (
            <Search className="size-8 text-slate-300" />
          ) : (
            <FileText className="size-8 text-slate-300" />
          )}
        </div>
        <h3 className="mb-1 text-lg font-bold text-slate-800">
          {searchTerm ? "Nenhum resultado encontrado" : "Nenhum aluno cadastrado"}
        </h3>
        <p className="max-w-sm text-sm leading-relaxed text-slate-600">
          {searchTerm
            ? `Não encontramos nada para "${searchTerm}". Tente buscar por nome, e-mail ou ID.`
            : "Nenhum aluno cadastrado."}
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-slate-100">
      {students.map((student) => (
        <StudentsTableRow key={student.id} student={student} />
      ))}
    </div>
  );
}

async function StudentsTablePagination({
  studentsPromise,
}: {
  studentsPromise: Promise<StudentsResult>;
}) {
  const { students, totalPages, error } = await studentsPromise;

  if (error || students.length === 0) {
    return null;
  }

  return <TablePagination totalPages={totalPages} />;
}

function StudentsTableRowsSkeleton() {
  return (
    <div className="divide-y divide-slate-100" aria-busy="true" aria-label="Carregando alunos">
      {Array.from({ length: 10 }, (_, index) => (
        <div
          key={index}
          className={`grid items-center p-5 lg:px-3 lg:py-4 xl:px-8 ${STUDENTS_TABLE_GRID}`}
        >
          <div className="flex min-w-0 items-center gap-4 lg:gap-3 xl:gap-4">
            <Skeleton className="size-10 shrink-0 rounded-full" />
            <div className="w-full space-y-2">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-4/5" />
              <Skeleton className="h-2.5 w-20" />
            </div>
          </div>
          <div className="flex min-w-0 items-center justify-between lg:justify-center">
            <Skeleton className="h-3 w-16 lg:hidden" />
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="flex min-w-0 items-center justify-between lg:justify-center">
            <Skeleton className="h-3 w-28 lg:hidden" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <div className="flex min-w-0 items-center justify-between lg:justify-center">
            <Skeleton className="h-3 w-16 lg:hidden" />
            <Skeleton className="h-8 w-28 rounded-lg" />
          </div>
          <div className="flex min-w-0 items-center justify-between lg:justify-center">
            <Skeleton className="h-3 w-24 lg:hidden" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <div className="flex min-w-0 items-center justify-between lg:justify-center">
            <Skeleton className="h-3 w-12 lg:hidden" />
            <Skeleton className="h-7 w-24 rounded-md" />
          </div>
          <div className="mt-2 flex min-w-0 justify-end border-t border-slate-100 pt-4 lg:mt-0 lg:border-t-0 lg:pt-0">
            <div className="flex gap-1">
              <Skeleton className="size-9 rounded-lg" />
              <Skeleton className="size-9 rounded-lg" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
