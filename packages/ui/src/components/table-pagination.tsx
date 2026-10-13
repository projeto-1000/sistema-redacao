"use client";

import { usePathname, useSearchParams } from "next/navigation";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@repo/ui/components/pagination";

interface TablePaginationProps {
  totalPages: number;
  pageParam?: string;
}

export function TablePagination({ totalPages, pageParam = "page" }: TablePaginationProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentPage = Number(searchParams.get(pageParam)) || 1;

  const createPageURL = (pageNumber: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(pageParam, pageNumber.toString());
    return `${pathname}?${params.toString()}`;
  };

  const getVisiblePages = (current: number, total: number) => {
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    if (current <= 4) {
      return [1, 2, 3, 4, 5, "ellipsis", total];
    }

    if (current >= total - 3) {
      return [1, "ellipsis", total - 4, total - 3, total - 2, total - 1, total];
    }

    return [1, "ellipsis", current - 1, current, current + 1, "ellipsis", total];
  };

  const visiblePages = getVisiblePages(currentPage, totalPages);

  return (
    <Pagination className="w-full justify-center">
      <PaginationContent className="gap-2">
        <PaginationItem>
          <PaginationPrevious
            href={currentPage > 1 ? createPageURL(currentPage - 1) : "#"}
            className={`h-10 w-10 rounded-full ${currentPage <= 1 ? "pointer-events-none opacity-50" : "text-slate-800! hover:bg-slate-200/60!"}`}
          />
        </PaginationItem>

        {visiblePages.map((page, index) => (
          <PaginationItem key={index}>
            {page === "ellipsis" ? (
              <PaginationEllipsis />
            ) : (
              <PaginationLink
                variant={currentPage === page ? "default" : "ghost"}
                href={createPageURL(page as number)}
                isActive={currentPage === page}
                className={`h-10 w-10 rounded-full ${currentPage === page ? "font-bold" : "border-none font-normal text-slate-800! hover:bg-slate-200/60! hover:font-medium!"} `}
              >
                {page}
              </PaginationLink>
            )}
          </PaginationItem>
        ))}

        <PaginationItem>
          <PaginationNext
            href={currentPage < totalPages ? createPageURL(currentPage + 1) : "#"}
            className={`h-10 w-10 rounded-full ${currentPage >= totalPages ? "pointer-events-none opacity-50" : "text-slate-800! hover:bg-slate-200/60!"}`}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
