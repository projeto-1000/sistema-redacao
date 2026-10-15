"use client";

import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ListFilter,
  NotebookPen,
  RotateCcw,
  Search,
  X,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useRef, useState, type ReactElement } from "react";
import { useDebouncedCallback } from "use-debounce";

import { getTopicDetails, getTopicsList } from "@/app/actions/get-topics";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { ScrollArea } from "@repo/ui/components/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@repo/ui/components/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@repo/ui/components/sheet";
import { Skeleton } from "@repo/ui/components/skeleton";
import { ThemeBadge } from "@repo/ui/components/theme-badge";
import { TopicDetailsDialog } from "@repo/ui/components/topic-details-dialog";
import type { EssayTopic, ThematicAxis } from "@repo/types";
import { AXIS_FILTERS, AXIS_ICONS } from "./topic-filter-options";

type TopicPickerFilters = {
  page: number;
  searchTerm: string;
  axisFilter: "Todos" | ThematicAxis;
};

type TopicsLoadState = {
  topics: EssayTopic[];
  totalPages: number;
  status: "idle" | "loading" | "success" | "error";
};

interface NewEssayTopicPickerProps {
  children: ReactElement;
}

function TopicPickerSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="rounded-3xl border border-slate-200 bg-white p-5">
          <Skeleton className="h-5 w-4/5 bg-slate-200" />
          <Skeleton className="mt-3 h-3 w-24 bg-slate-200" />
          <Skeleton className="mt-3 h-6 w-28 rounded-full bg-slate-200" />
          <div className="mt-4 flex justify-end gap-2">
            <Skeleton className="h-9 w-28 rounded-xl bg-slate-200" />
            <Skeleton className="h-9 w-32 rounded-xl bg-slate-200" />
          </div>
        </div>
      ))}
    </div>
  );
}

function TopicPickerRow({ topic }: { topic: EssayTopic }) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50/60">
      <h3 className="leading-snug font-bold">{topic.title}</h3>

      <p className="mt-2 text-xs text-slate-500">
        {topic.source_type}
        {topic.source_type !== "AUTORAL" && topic.source_year ? ` • ${topic.source_year}` : ""}
      </p>

      <ThemeBadge
        className="mt-3 inline-flex rounded-full border px-3 py-1 text-[10px] font-bold uppercase"
        value={topic.axis}
      />

      <div className="mt-4 flex items-center justify-end gap-2">
        <TopicDetailsDialog
          topic={topic}
          getTopicDetailsAction={getTopicDetails}
          className="min-h-9 w-auto rounded-xl px-3 md:w-auto"
        />

        <Button asChild className="h-9 rounded-xl px-3 text-xs font-bold shadow-sm">
          <Link href={`/minhas-redacoes/nova-redacao?id=${topic.id}`}>
            Iniciar redação
            <NotebookPen className="size-3.5" />
          </Link>
        </Button>
      </div>
    </article>
  );
}

export function NewEssayTopicPicker({ children }: NewEssayTopicPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState<TopicPickerFilters>({
    page: 1,
    searchTerm: "",
    axisFilter: "Todos",
  });
  const [topicsState, setTopicsState] = useState<TopicsLoadState>({
    topics: [],
    totalPages: 0,
    status: "idle",
  });

  const requestIdRef = useRef(0);
  const pendingKeyRef = useRef<string | null>(null);
  const loadedKeyRef = useRef<string | null>(null);

  const loadTopics = useCallback(
    async (search: string, axis: "Todos" | ThematicAxis, requestedPage: number, force = false) => {
      const requestKey = `${search}|${axis}|${requestedPage}`;

      if (!force && (pendingKeyRef.current === requestKey || loadedKeyRef.current === requestKey)) {
        return;
      }

      const requestId = ++requestIdRef.current;
      pendingKeyRef.current = requestKey;
      setTopicsState((currentState) => ({ ...currentState, status: "loading" }));

      try {
        const result = await getTopicsList({
          filters: { search: search || undefined, axis },
          page: requestedPage,
        });

        if (requestId !== requestIdRef.current) return;

        if (result.error) {
          setTopicsState({ topics: [], totalPages: 0, status: "error" });
          return;
        }

        setTopicsState({
          topics: result.topics,
          totalPages: result.totalPages,
          status: "success",
        });
        loadedKeyRef.current = requestKey;
      } catch {
        if (requestId === requestIdRef.current) {
          setTopicsState({ topics: [], totalPages: 0, status: "error" });
        }
      } finally {
        if (requestId === requestIdRef.current) {
          pendingKeyRef.current = null;
        }
      }
    },
    []
  );

  const debouncedSearchTopics = useDebouncedCallback(
    (searchTerm: string, axis: "Todos" | ThematicAxis) => {
      void loadTopics(searchTerm, axis, 1);
    },
    500
  );

  const prefetchTopics = useCallback(() => {
    if (topicsState.status === "idle") {
      void loadTopics("", "Todos", 1);
    }
  }, [loadTopics, topicsState.status]);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);

    if (open) {
      void loadTopics(filters.searchTerm, filters.axisFilter, filters.page);
    } else {
      debouncedSearchTopics.cancel();
    }
  };

  const handleSearchChange = (searchTerm: string) => {
    setFilters((currentFilters) => ({ ...currentFilters, searchTerm, page: 1 }));
    debouncedSearchTopics(searchTerm, filters.axisFilter);
  };

  const handleAxisChange = (axis: "Todos" | ThematicAxis) => {
    debouncedSearchTopics.cancel();
    setFilters((currentFilters) => ({ ...currentFilters, axisFilter: axis, page: 1 }));
    void loadTopics(filters.searchTerm, axis, 1);
  };

  const handlePageChange = (page: number) => {
    setFilters((currentFilters) => ({ ...currentFilters, page }));
    void loadTopics(filters.searchTerm, filters.axisFilter, page);
  };

  const retry = () => {
    void loadTopics(filters.searchTerm, filters.axisFilter, filters.page, true);
  };

  const isLoading = topicsState.status === "idle" || topicsState.status === "loading";
  const SelectedAxisIcon =
    filters.axisFilter === "Todos" ? ListFilter : AXIS_ICONS[filters.axisFilter];

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <span className="contents" onPointerEnter={prefetchTopics} onFocusCapture={prefetchTopics}>
        <SheetTrigger asChild>{children}</SheetTrigger>
      </span>

      <SheetContent
        className="gap-0 p-0 sm:max-w-2xl"
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        <header className="shrink-0 border-b border-slate-200 px-5 py-4 pr-14 sm:px-6 sm:pr-16">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#FFF9E6] text-[#EBC84C]">
              <NotebookPen className="size-4.5" />
            </div>
            <div>
              <SheetTitle className="text-xl font-extrabold">Escolha um tema</SheetTitle>
              <SheetDescription className="mt-0.5 text-xs text-slate-500 sm:text-sm">
                Encontre uma proposta para começar sua redação.
              </SheetDescription>
            </div>
          </div>
        </header>

        <div className="shrink-0 border-b border-slate-100 px-5 py-4 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                type="search"
                aria-label="Pesquisar temas"
                placeholder="Pesquisar por título, eixo ou palavra-chave..."
                className="focus-visible:border-primary focus-visible:ring-primary/20 h-14 rounded-2xl border-transparent bg-slate-50 pr-5 pl-11 font-medium text-slate-700 shadow-none hover:bg-slate-100/70"
                value={filters.searchTerm}
                onChange={(event) => handleSearchChange(event.target.value)}
              />
            </div>

            <div className="flex w-full items-center gap-2 sm:w-auto">
              <Select
                value={filters.axisFilter}
                onValueChange={(value) => handleAxisChange(value as ThematicAxis)}
              >
                <SelectTrigger
                  aria-label="Filtrar por eixo temático"
                  className={`focus-visible:border-primary focus-visible:ring-primary/20 focus:border-primary focus:ring-primary/20 h-14! min-w-0 flex-1 cursor-pointer rounded-2xl px-5 shadow-none transition-colors hover:bg-slate-100 sm:w-auto sm:max-w-80 sm:flex-none ${
                    filters.axisFilter === "Todos"
                      ? "border-transparent bg-slate-50"
                      : "border-primary bg-slate-50"
                  }`}
                >
                  <span className="flex min-w-0 items-center gap-2.5">
                    <SelectedAxisIcon className="size-4 text-slate-400" />
                    {filters.axisFilter === "Todos" ? (
                      <span className="text-xs font-bold tracking-wider text-slate-400 uppercase">
                        Eixo temático
                      </span>
                    ) : (
                      <span className="min-w-0 truncate text-xs font-bold text-slate-700 uppercase">
                        {filters.axisFilter}
                      </span>
                    )}
                  </span>
                </SelectTrigger>
                <SelectContent
                  position="popper"
                  align="end"
                  className="z-60 rounded-2xl border-slate-200 shadow-lg"
                >
                  {AXIS_FILTERS.filter((axis) => axis !== "Todos").map((axis) => {
                    const Icon = AXIS_ICONS[axis];

                    return (
                      <SelectItem
                        key={axis}
                        value={axis}
                        className="focus:bg-primary/10 data-[state=checked]:bg-primary/30 data-[state=checked]:text-primary-foreground hover:*:text-primary hover:bg-primary/10 rounded-xl py-2.5 hover:*:font-bold data-[state=checked]:font-bold"
                      >
                        <Icon className="size-4 text-slate-500" />
                        {axis}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>

              {filters.axisFilter !== "Todos" && (
                <button
                  type="button"
                  aria-label="Limpar filtro de eixo temático"
                  className="flex size-14 shrink-0 cursor-pointer items-center justify-center rounded-2xl bg-red-50 text-red-500 transition-colors hover:bg-red-100/80 focus-visible:ring-2 focus-visible:ring-red-200 focus-visible:outline-none"
                  onClick={() => handleAxisChange("Todos")}
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        <ScrollArea className="min-h-0 flex-1 bg-slate-50/50">
          <div className="px-5 py-5 sm:px-6">
            <div className="mb-4 flex items-center justify-between gap-4">
              <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                Temas disponíveis
              </span>
            </div>

            {topicsState.status === "error" ? (
              <div className="flex min-h-72 flex-col items-center justify-center rounded-3xl border-2 border-dashed border-red-100 bg-white px-6 text-center">
                <AlertCircle className="mb-3 size-9 text-red-400" />
                <h3 className="font-bold text-slate-800">Não foi possível carregar os temas</h3>
                <p className="mt-1 max-w-sm text-sm text-slate-500">
                  Tente novamente para continuar escolhendo sua proposta.
                </p>
                <Button variant="outline" className="mt-5 rounded-2xl" onClick={retry}>
                  <RotateCcw className="size-4" />
                  Tentar novamente
                </Button>
              </div>
            ) : isLoading ? (
              <TopicPickerSkeleton />
            ) : topicsState.topics.length > 0 ? (
              <div className="space-y-3">
                {topicsState.topics.map((topic) => (
                  <TopicPickerRow key={topic.id} topic={topic} />
                ))}
              </div>
            ) : (
              <div className="flex min-h-72 flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-white px-6 text-center">
                <Search className="mb-3 size-9 text-slate-300" />
                <h3 className="font-bold text-slate-800">Nenhum tema encontrado</h3>
                <p className="mt-1 max-w-sm text-sm text-slate-500">
                  Tente buscar por outros termos ou escolha outro eixo temático.
                </p>
              </div>
            )}
          </div>
        </ScrollArea>

        {topicsState.totalPages > 1 && topicsState.status !== "error" && (
          <footer className="border-primary/30 shrink-0 border-t bg-white px-5 py-3 sm:px-6">
            <nav aria-label="Paginação de temas" className="flex items-center justify-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="Página anterior"
                className="border-primary/50 hover:bg-primary/10 rounded-full bg-white text-slate-700 shadow-sm hover:text-slate-900"
                disabled={filters.page <= 1 || isLoading}
                onClick={() => handlePageChange(Math.max(1, filters.page - 1))}
              >
                <ChevronLeft className="size-4" />
              </Button>

              <span
                aria-live="polite"
                className="bg-primary text-primary-foreground flex h-9 min-w-28 items-center justify-center rounded-full px-4 text-xs font-bold shadow-sm"
              >
                Página {filters.page} de {topicsState.totalPages}
              </span>

              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="Próxima página"
                className="border-primary/50 hover:bg-primary/10 rounded-full bg-white text-slate-700 shadow-sm hover:text-slate-900"
                disabled={filters.page >= topicsState.totalPages || isLoading}
                onClick={() => handlePageChange(Math.min(topicsState.totalPages, filters.page + 1))}
              >
                <ChevronRight className="size-4" />
              </Button>
            </nav>
          </footer>
        )}
      </SheetContent>
    </Sheet>
  );
}
