"use client";

import {
  exportFreeCorrectionCampaignAudienceCsv,
  exportFreeCorrectionCampaignCsv,
  exportFreeCorrectionCampaignEventsCsv,
} from "@/app/actions/free-correction-campaign";
import { Button } from "@repo/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu";
import { BarChart3, ChevronDown, Download, ListTree, Users } from "lucide-react";
import { useState } from "react";

interface CampaignExportMenuProps {
  from: string;
  to: string;
  fromDate: string;
  toDate: string;
}

type ExportKind = "metrics" | "journey" | "events";

const EXPORTS = {
  metrics: {
    label: "Métricas gerais",
    description: "Indicadores, funil e comparação dos banners",
    icon: BarChart3,
    action: exportFreeCorrectionCampaignCsv,
    filePrefix: "metricas_campanha_correcao_gratuita",
  },
  journey: {
    label: "Jornada dos alunos",
    description: "Uma linha por aluno com todas as etapas",
    icon: Users,
    action: exportFreeCorrectionCampaignAudienceCsv,
    filePrefix: "jornada_alunos_campanha_correcao_gratuita",
  },
  events: {
    label: "Histórico de eventos",
    description: "Cada visualização, clique e avanço no funil",
    icon: ListTree,
    action: exportFreeCorrectionCampaignEventsCsv,
    filePrefix: "eventos_campanha_correcao_gratuita",
  },
} satisfies Record<
  ExportKind,
  {
    label: string;
    description: string;
    icon: typeof BarChart3;
    action: (payload: { from: string; to: string }) => Promise<string>;
    filePrefix: string;
  }
>;

export function CampaignExportMenu({ from, to, fromDate, toDate }: CampaignExportMenuProps) {
  const [exporting, setExporting] = useState<ExportKind | null>(null);

  const executeExport = async (kind: ExportKind) => {
    setExporting(kind);

    try {
      const exportConfig = EXPORTS[kind];
      const csv = await exportConfig.action({ from, to });
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = `${exportConfig.filePrefix}_${fromDate}_${toDate}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      alert("Não foi possível gerar o arquivo. Tente novamente.");
    } finally {
      setExporting(null);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          disabled={exporting !== null}
          className="h-10 w-full rounded-xl border-slate-200 bg-white font-bold text-slate-700 sm:w-auto"
          isLoading={exporting !== null}
          loadingText="Exportando..."
        >
          <Download className="size-4" aria-hidden="true" />
          Exportar
          <ChevronDown className="size-4 text-slate-400" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80 rounded-xl border-slate-200 p-2 shadow-lg">
        <DropdownMenuLabel className="px-2 py-2 text-xs font-bold tracking-wider text-slate-400 uppercase">
          Exportar CSV
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {(Object.entries(EXPORTS) as [ExportKind, (typeof EXPORTS)[ExportKind]][]).map(
          ([kind, exportConfig]) => {
            const Icon = exportConfig.icon;

            return (
              <DropdownMenuItem
                key={kind}
                onSelect={() => void executeExport(kind)}
                className="items-start rounded-lg px-3 py-3"
              >
                <Icon className="mt-0.5 size-4" aria-hidden="true" />
                <span>
                  <span className="block font-semibold text-slate-900">{exportConfig.label}</span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-slate-500">
                    {exportConfig.description}
                  </span>
                </span>
              </DropdownMenuItem>
            );
          }
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
