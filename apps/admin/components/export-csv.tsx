"use client";

import { useState } from "react";
import { Button } from "@repo/ui/components/button";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@repo/ui/components/alert-dialog";
import { Download } from "lucide-react";

interface ExportCsvButtonProps<T> {
  action: (payload: T) => Promise<string>;
  payload: T;
  fileName: string;
  className?: string
}

export function ExportCsvButton<T>({
  action,
  payload,
  fileName,
  className = ''
}: ExportCsvButtonProps<T>) {
  const [isExporting, setIsExporting] = useState(false);
  const [showDialog, setShowDialog] = useState(false);

  const hasActiveFilters = payload && typeof payload === 'object'
    ? Object.values(payload).some(value => value !== undefined && value !== null && value !== "")
    : false;

  const executeExport = async () => {
    setShowDialog(false);
    setIsExporting(true);

    try {
      const csvString = await action(payload);

      const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${fileName}_${new Date().toISOString().split("T")[0]}.csv`);
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

  const handleClick = () => {
    if (!hasActiveFilters) {
      setShowDialog(true);
    } else {
      executeExport();
    }
  };

  return (
    <>
      <Button
        variant="outline"
        onClick={handleClick}
        disabled={isExporting}
        className={`rounded-xl font-bold h-10 ${className}`}
        isLoading={isExporting}
        loadingText="Exportando..."
      >
        <Download className="size-4 mr-2" /> Exportar CSV
      </Button>

      <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Exportar base completa?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-600 leading-relaxed">
              Você está prestes a exportar toda a base de dados. Como não há filtros ativos, isso pode demorar alguns instantes.
              <br /><br />
              Deseja continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl font-bold h-10">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={executeExport} className="rounded-xl font-bold h-10 bg-blue-600 hover:bg-blue-700 text-white">
              Sim, exportar dados
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}