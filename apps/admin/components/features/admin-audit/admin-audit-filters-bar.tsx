"use client";

import { TableFilterBar, type FilterOption } from "@repo/ui/components/table-filter-bar";
import { Layers3, UserRound } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import type { DateRange } from "react-day-picker";
import { useDebounce } from "use-debounce";

interface AuditActorOption {
  id: string;
  full_name: string | null;
  email: string;
}

function parseDateParam(value: string | null) {
  if (!value) return undefined;
  const date = new Date(`${value.slice(0, 10)}T12:00:00`);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function formatDateParam(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function AdminAuditFiltersBar({ actors }: { actors: AuditActorOption[] }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") ?? "");
  const [actorId, setActorId] = useState(searchParams.get("actorId") ?? "all");
  const [resourceType, setResourceType] = useState(
    searchParams.get("resourceType") ?? "all"
  );
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    const from = parseDateParam(searchParams.get("from"));
    const to = parseDateParam(searchParams.get("to"));
    return from || to ? { from, to } : undefined;
  });
  const [debouncedSearch] = useDebounce(searchTerm, 500);

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    const currentFilters = new URLSearchParams(searchParams.toString());
    currentFilters.delete("page");

    if (debouncedSearch.trim()) params.set("search", debouncedSearch.trim());
    else params.delete("search");

    if (actorId && actorId !== "all") params.set("actorId", actorId);
    else params.delete("actorId");

    if (resourceType && resourceType !== "all") params.set("resourceType", resourceType);
    else params.delete("resourceType");

    if (dateRange?.from) params.set("from", formatDateParam(dateRange.from));
    else params.delete("from");

    if (dateRange?.to) params.set("to", formatDateParam(dateRange.to));
    else params.delete("to");

    params.delete("page");
    const nextQuery = params.toString();
    const currentQuery = currentFilters.toString();

    if (nextQuery === currentQuery) return;

    startTransition(() => {
      router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
    });
  }, [actorId, dateRange, debouncedSearch, pathname, resourceType, router, searchParams]);

  const filters: FilterOption[] = [
    {
      id: "actor",
      label: "Admin",
      value: actorId,
      defaultValue: "all",
      icon: UserRound,
      onChange: setActorId,
      options: [
        { label: "Todos admins", value: "all" },
        ...actors.map((actor) => ({
          label: actor.full_name || actor.email,
          value: actor.id,
        })),
      ],
    },
    {
      id: "resource-type",
      label: "Tipo",
      value: resourceType,
      defaultValue: "all",
      icon: Layers3,
      onChange: setResourceType,
      options: [
        { label: "Todos", value: "all" },
        { label: "Aluno", value: "student_profile" },
        { label: "Convite de professor", value: "teacher_invitation" },
        { label: "Pagamento", value: "teacher_payment" },
        { label: "Revisão de correção", value: "correction_review" },
        { label: "Créditos", value: "manual_credit_grant" },
        { label: "Assinatura", value: "subscription_support" },
      ],
    },
  ];

  return (
    <TableFilterBar
      searchPlaceholder="Buscar por atividade ou referência..."
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      filters={filters}
      dateRange={dateRange}
      onDateRangeChange={setDateRange}
      dateFilterLabel="Data"
      theme="admin"
    />
  );
}
