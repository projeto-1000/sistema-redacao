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
}

export function TablePagination({ totalPages }: TablePaginationProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentPage = Number(searchParams.get("page")) || 1;

  const createPageURL = (pageNumber: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", pageNumber.toString());
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

    <Pagination className="justify-center w-full">
      <PaginationContent className="gap-2">

        <PaginationItem>
          <PaginationPrevious
            href={currentPage > 1 ? createPageURL(currentPage - 1) : "#"}
            className={currentPage <= 1 ? "rounded-full h-10 w-10 pointer-events-none opacity-50" : ""}
          // scroll={false}
          />
        </PaginationItem>

        {visiblePages.map((page, index) => (
          <PaginationItem key={index}>
            {page === "ellipsis" ? (
              <PaginationEllipsis />
            ) : (
              <PaginationLink
                variant={currentPage === page ? 'default' : 'ghost'}
                href={createPageURL(page as number)}
                isActive={currentPage === page}
                className={`rounded-full h-10 w-10 ${currentPage === page ? 'font-bold' : 'border-none font-normal'} `}
              // size={'lg'}
              // scroll={false}
              >
                {page}
              </PaginationLink>
            )}
          </PaginationItem>
        ))}

        <PaginationItem>
          <PaginationNext
            href={currentPage < totalPages ? createPageURL(currentPage + 1) : "#"}
            className={currentPage >= totalPages ? "rounded-full h-10 w-10 pointer-events-none opacity-50" : ""}
          // scroll={false}
          />
        </PaginationItem>

      </PaginationContent>
    </Pagination >
  );
}