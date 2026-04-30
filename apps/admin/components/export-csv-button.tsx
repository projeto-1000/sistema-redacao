"use client";

import { useState } from "react";
import { Button } from "@repo/ui/components/button";
import { Upload, Loader2 } from "lucide-react";
import { exportStudentsCsvAction } from "@/app/actions/export-students-csv";
import { GetStudentsFilters } from "@/types";

interface ExportCsvButtonProps {
  filters: GetStudentsFilters;
}

export function ExportCsvButton({ filters }: ExportCsvButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const hasActiveFilters = !!(filters.search || filters.status || filters.from || filters.to);

  const handleExport = async () => {
    if (!hasActiveFilters) {
      const confirm = window.confirm(
        "Você está exportando toda a base de alunos e isso pode demorar alguns instantes dependendo da quantidade de dados.\n\nDeseja continuar?"
      );
      if (!confirm) return;
    }

    setIsExporting(true);

    try {
      const csvString = await exportStudentsCsvAction(filters);

      const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `exportacao_alunos_${new Date().toISOString().split("T")[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (error) {
      console.error(error);
      alert("Ocorreu um erro ao gerar o CSV. Tente novamente.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      variant="outline"
      onClick={handleExport}
      disabled={isExporting}
      className="font-bold text-slate-700 bg-white border-slate-200 hover:bg-slate-50 rounded-xl h-10"
    >
      {isExporting ? (
        <Loader2 className="size-4 mr-2 animate-spin text-slate-500" />
      ) : (
        <Upload className="size-4 mr-2" />
      )}
      {isExporting ? "Exportando..." : "Exportar CSV"}
    </Button>
  );
}