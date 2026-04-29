import { useState } from "react";

interface UseCsvExportOptions {
  exportAction: () => Promise<string>;
  hasActiveFilters?: boolean;
  fileNamePrefix?: string;
}

export function useCsvExport({
  exportAction,
  hasActiveFilters = false,
  fileNamePrefix = "exportacao",
}: UseCsvExportOptions) {
  const [isExporting, setIsExporting] = useState(false);
  const [showWarningDialog, setShowWarningDialog] = useState(false);

  const executeExport = async () => {
    setShowWarningDialog(false);
    setIsExporting(true);

    try {
      const csvString = await exportAction();
      const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `${fileNamePrefix}_${new Date().toISOString().split("T")[0]}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      alert("Ocorreu um erro ao gerar o CSV. Tente novamente.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportClick = () => {
    if (!hasActiveFilters) {
      setShowWarningDialog(true);
    } else {
      executeExport();
    }
  };

  return { handleExportClick, executeExport, isExporting, showWarningDialog, setShowWarningDialog };
}
