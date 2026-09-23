"use client";

import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import Link from "next/link";
import { MouseEvent, ReactNode } from "react";
import { useStudentsNavigation } from "./students-navigation-provider";
import { STUDENTS_TABLE_GRID } from "./students-table-layout";

type SortField = "created_at" | "full_name" | "status";

interface StudentsTableShellProps {
  children: ReactNode;
  order: "asc" | "desc";
  pagination: ReactNode;
  rowsSkeleton: ReactNode;
  sort: SortField;
  sortHrefs: Record<SortField, string>;
}

export function StudentsTableShell({
  children,
  order,
  pagination,
  rowsSkeleton,
  sort,
  sortHrefs,
}: StudentsTableShellProps) {
  const { isPending, navigate } = useStudentsNavigation();

  const handleSort = (event: MouseEvent<HTMLAnchorElement>, href: string) => {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    event.preventDefault();

    if (isPending) {
      return;
    }

    navigate(href);
  };

  const getSortIcon = (field: SortField) => {
    if (sort !== field) {
      return <ArrowUpDown className="size-3" />;
    }

    return order === "asc" ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />;
  };

  const sortLinkClassName =
    "inline-flex min-w-0 items-center gap-1 text-[9px] font-bold tracking-widest text-slate-400 uppercase transition-colors hover:text-slate-700 xl:gap-1.5 xl:text-[10px]";

  return (
    <>
      <div className="overflow-hidden rounded-4xl border border-slate-200 bg-white shadow-sm">
        <div
          className={`hidden items-center border-b border-slate-100 bg-slate-50/50 px-3 py-4 lg:grid xl:px-8 xl:py-5 ${STUDENTS_TABLE_GRID}`}
        >
          <div className="flex min-w-0 items-center">
            <Link
              href={sortHrefs.full_name}
              onClick={(event) => handleSort(event, sortHrefs.full_name)}
              className={sortLinkClassName}
            >
              Aluno
              {getSortIcon("full_name")}
            </Link>
          </div>
          <div className="flex min-w-0 items-center justify-center">
            <Link
              href={sortHrefs.created_at}
              onClick={(event) => handleSort(event, sortHrefs.created_at)}
              className={sortLinkClassName}
            >
              Cadastro
              {getSortIcon("created_at")}
            </Link>
          </div>
          <div className="flex min-w-0 items-center justify-center text-center text-[9px] font-bold tracking-widest text-slate-400 uppercase xl:text-[10px]">
            Plano e vigência
          </div>
          <div className="flex min-w-0 items-center justify-center text-center text-[9px] font-bold tracking-widest text-slate-400 uppercase xl:text-[10px]">
            Créditos
          </div>
          <div className="flex min-w-0 items-center justify-center text-center text-[9px] font-bold tracking-widest text-slate-400 uppercase xl:text-[10px]">
            Última atividade
          </div>
          <div className="flex min-w-0 items-center justify-center">
            <Link
              href={sortHrefs.status}
              onClick={(event) => handleSort(event, sortHrefs.status)}
              className={sortLinkClassName}
            >
              Status
              {getSortIcon("status")}
            </Link>
          </div>
          <div className="flex min-w-0 items-center justify-end text-right text-[9px] font-bold tracking-widest text-slate-400 uppercase xl:text-[10px]">
            Ações
          </div>
        </div>

        {isPending ? rowsSkeleton : children}
      </div>

      {pagination}
    </>
  );
}
