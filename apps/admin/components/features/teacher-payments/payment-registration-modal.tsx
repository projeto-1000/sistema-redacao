"use client";

import { useState, useRef, useTransition } from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@repo/ui/components/dialog";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu";
import {
  Banknote,
  CalendarDays,
  Copy,
  UploadCloud,
  CheckCircle2,
  User,
  Receipt,
  FileText,
  X,
  KeyRound,
  Landmark,
  AlertCircle,
  ArrowRightLeft,
} from "lucide-react";
import { createTeacherPayment } from "@/app/actions/teacher-payments";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { AccountData, type PaymentMetrics } from "@/types";
import { maskPixKey } from "@repo/utils";

const MAX_RECEIPT_SIZE_BYTES = 10 * 1024 * 1024;

function getTodayInSaoPaulo() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

interface PaymentRegistrationModalProps {
  teacherId: string;
  month: string;
  metrics: PaymentMetrics;
  accounts: AccountData[];
}

export function PaymentRegistrationModal({
  teacherId,
  month,
  metrics,
  accounts,
}: PaymentRegistrationModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [paymentDate, setPaymentDate] = useState(getTodayInSaoPaulo);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedAccount, setSelectedAccount] = useState<AccountData | null>(() => {
    return accounts.find((a) => a.is_default) || accounts[0] || null;
  });

  const formattedPeriod = format(parseISO(`${month}-01`), "MMMM / yyyy", { locale: ptBR });

  const handleCopyPix = () => {
    if (!selectedAccount?.pix_key) return;
    navigator.clipboard.writeText(selectedAccount.pix_key);
    toast.success("Chave PIX copiada!");
  };

  const handleCopyBank = () => {
    if (!selectedAccount) return;
    const bankData = `Banco: ${selectedAccount.bank_name}\nAgência: ${selectedAccount.agency}\nConta: ${selectedAccount.account_number} (${selectedAccount.account_variant})`;
    navigator.clipboard.writeText(bankData);
    toast.success("Dados bancários copiados!");
  };

  const selectReceipt = (selectedFile?: File) => {
    if (!selectedFile) return;

    if (selectedFile.type !== "application/pdf") {
      toast.error("Selecione um arquivo PDF.");
      return;
    }

    if (selectedFile.size > MAX_RECEIPT_SIZE_BYTES) {
      toast.error("O comprovante deve ter no máximo 10 MB.");
      return;
    }

    setFile(selectedFile);
  };

  const clearReceipt = () => {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    selectReceipt(event.target.files?.[0]);
  };

  const handleFileDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDraggingFile(false);
    selectReceipt(event.dataTransfer.files?.[0]);
  };

  const handleSubmit = () => {
    if (!file) {
      toast.error("Por favor, anexe o comprovante de pagamento.");
      return;
    }

    const formData = new FormData();
    formData.append("receipt", file);
    formData.append("teacherId", teacherId);
    formData.append("month", month);
    formData.append("paymentDate", paymentDate);

    startTransition(async () => {
      try {
        const result = await createTeacherPayment(formData);
        if (result.success) {
          toast.success("Pagamento registrado com sucesso!");
          setIsOpen(false);
          clearReceipt();
        } else {
          toast.error(result.error || "Erro ao registrar pagamento.");
        }
      } catch {
        toast.error("Erro ao registrar pagamento.");
      }
    });
  };

  const handleOpenChange = (open: boolean) => {
    if (open) {
      setSelectedAccount(accounts.find((a) => a.is_default) || accounts[0] || null);
      setPaymentDate(getTodayInSaoPaulo());
    } else {
      clearReceipt();
      setIsDraggingFile(false);
    }

    setIsOpen(open);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="h-14 w-full rounded-2xl text-sm font-black shadow-sm">
          <Banknote className="mr-2 size-5" /> Registrar Pagamento Manual
        </Button>
      </DialogTrigger>

      <DialogContent className="flex h-[90dvh] max-w-md flex-col overflow-hidden rounded-4xl border-none bg-white p-0 shadow-2xl">
        <DialogHeader className="flex shrink-0 items-center border-b border-slate-50 p-6 pb-4">
          <DialogTitle className="text-xl font-black tracking-tight">
            Confirmar Pagamento
          </DialogTitle>
        </DialogHeader>

        <div className="no-scrollbar flex-1 space-y-6 overflow-y-auto px-6">
          <div className="rounded-2xl border border-slate-200 bg-slate-100 p-4">
            <div className="mb-4 flex items-center gap-2">
              <User className="size-4 text-blue-600" />
              <h4 className="text-sm font-bold text-slate-800">Dados do Titular</h4>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="mb-1 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                  Nome Completo
                </p>
                <p
                  className="truncate text-sm font-bold text-slate-700"
                  title={selectedAccount?.owner_name}
                >
                  {selectedAccount?.owner_name || "Não cadastrado"}
                </p>
              </div>
              <div>
                <p className="mb-1 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                  CPF / CNPJ
                </p>
                <p className="text-sm font-bold text-slate-700">
                  {selectedAccount?.owner_document || "Não informado"}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col rounded-2xl border border-slate-200 bg-slate-100 p-4">
            <div className="mb-4 flex items-center gap-2">
              <Receipt className="text-primary size-4" />
              <h4 className="text-sm font-bold text-slate-800">Resumo do Pagamento</h4>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="mb-1 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                  Período Referência
                </p>
                <p className="text-sm font-bold text-slate-700 capitalize">{formattedPeriod}</p>
              </div>
              <div>
                <p className="mb-1 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                  Redações Corrigidas
                </p>
                <p className="text-sm font-bold text-slate-700">{metrics.totalEssays}</p>
              </div>
            </div>

            <div className="mt-4 flex items-end justify-end gap-6 rounded-xl">
              <p className="mb-0.5 text-[10px] font-black tracking-widest text-slate-500 uppercase">
                Valor Total
              </p>
              <p className="text-primary text-lg font-black">
                R$ {metrics.totalAmount.toFixed(2).replace(".", ",")}
              </p>
            </div>

            <label className="mt-4 block border-t border-slate-200 pt-4">
              <span className="mb-2 flex items-center gap-2 text-[10px] font-black tracking-widest text-slate-500 uppercase">
                <CalendarDays className="text-primary size-3.5" /> Data do pagamento
              </span>
              <Input
                type="date"
                value={paymentDate}
                max={getTodayInSaoPaulo()}
                onChange={(event) => setPaymentDate(event.target.value)}
                className="h-11 rounded-xl border-slate-200 bg-white"
                required
              />
            </label>
          </div>

          <div>
            {!selectedAccount ? (
              <div className="flex items-center gap-3 rounded-2xl border border-orange-100 bg-orange-50 p-4 text-orange-700">
                <AlertCircle className="size-5 shrink-0" />
                <p className="text-sm font-medium">
                  Este professor ainda não cadastrou uma conta bancária padrão.
                </p>
              </div>
            ) : (
              <>
                <div className="mb-3 flex items-center justify-between">
                  <h4 className="flex items-center gap-2 text-sm font-black text-slate-800">
                    {selectedAccount.type === "pix" ? (
                      <KeyRound className="size-4 text-purple-600" />
                    ) : (
                      <Landmark className="size-4 text-blue-600" />
                    )}
                    Conta de Recebimento
                    {selectedAccount.is_default && (
                      <span className="ml-1 rounded-sm bg-emerald-50 px-1.5 py-0.5 text-[9px] tracking-wider text-emerald-600 uppercase">
                        Padrão
                      </span>
                    )}
                  </h4>

                  {accounts.length > 1 && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-[14px] font-bold text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                        >
                          <ArrowRightLeft className="size-3.5" /> Trocar conta
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-70 rounded-xl p-1">
                        {accounts.map((acc, index) => (
                          <DropdownMenuItem
                            key={acc.id || index}
                            onClick={() => setSelectedAccount(acc)}
                            className={`flex cursor-pointer flex-col items-start gap-1 rounded-lg p-3 ${selectedAccount.id === acc.id ? "bg-slate-50" : ""}`}
                          >
                            <div className="flex w-full items-center justify-between">
                              <span className="text-sm font-bold text-slate-800">
                                {acc.type === "pix" ? "Chave PIX" : acc.bank_name}
                              </span>
                              {acc.is_default && (
                                <span className="rounded-sm bg-emerald-50 px-1.5 py-0.5 text-[9px] tracking-wider text-emerald-600 uppercase">
                                  Padrão
                                </span>
                              )}
                            </div>
                            <span className="text-xs font-medium text-slate-500">
                              {acc.type === "pix"
                                ? acc.pix_key
                                : `Ag: ${acc.agency} | CC: ${acc.account_number}`}
                            </span>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>

                {selectedAccount.type === "pix" ? (
                  <div className="flex items-center gap-2">
                    <div className="flex h-11 flex-1 items-center justify-between overflow-hidden rounded-xl border border-slate-200 bg-slate-50 px-3">
                      <span className="truncate text-sm font-medium text-slate-600">
                        {maskPixKey(
                          selectedAccount.pix_key ?? "",
                          selectedAccount.pix_type ?? "cpf"
                        )}
                      </span>
                      <span className="ml-2 shrink-0 rounded-md bg-[#FDEEE3] px-2 py-1 text-[10px] font-black tracking-wider text-[#C47E3A] uppercase">
                        {selectedAccount.pix_type}
                      </span>
                    </div>
                    <Button
                      onClick={handleCopyPix}
                      className="h-11 shrink-0 rounded-xl text-[14px] shadow-sm"
                    >
                      <Copy className="size-3.5" /> Copiar
                    </Button>
                  </div>
                ) : (
                  <div className="group relative">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleCopyBank}
                      className="absolute top-2 right-2 z-10 h-8 w-8 rounded-lg border border-slate-100 bg-white text-slate-400 opacity-0 shadow-sm transition-opacity group-hover:opacity-100 hover:bg-blue-50 hover:text-blue-600"
                    >
                      <Copy className="size-3.5" />
                    </Button>
                    <div className="grid grid-cols-2 gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="col-span-2">
                        <p className="mb-0.5 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                          Banco
                        </p>
                        <p className="text-sm font-bold text-slate-700">
                          {selectedAccount.bank_name}
                        </p>
                      </div>
                      <div>
                        <p className="mb-0.5 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                          Agência
                        </p>
                        <p className="text-sm font-bold text-slate-700">{selectedAccount.agency}</p>
                      </div>
                      <div>
                        <p className="mb-0.5 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                          Conta{" "}
                          {selectedAccount.account_variant === "poupanca" ? "Poupança" : "Corrente"}
                        </p>
                        <p className="text-sm font-bold text-slate-700">
                          {selectedAccount.account_number}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <div>
            <h4 className="mb-4 flex items-center gap-2 text-sm font-black text-slate-800">
              <FileText className="text-primary size-4" /> Comprovante de Pagamento
            </h4>

            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="application/pdf,.pdf"
              onChange={handleFileChange}
            />

            {!file ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    fileInputRef.current?.click();
                  }
                }}
                onDragEnter={(event) => {
                  event.preventDefault();
                  setIsDraggingFile(true);
                }}
                onDragOver={(event) => {
                  event.preventDefault();
                  event.dataTransfer.dropEffect = "copy";
                }}
                onDragLeave={(event) => {
                  if (!event.currentTarget.contains(event.relatedTarget as Node | null))
                    setIsDraggingFile(false);
                }}
                onDrop={handleFileDrop}
                role="button"
                tabIndex={0}
                className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition-colors ${isDraggingFile ? "border-primary bg-blue-50" : "hover:border-primary border-slate-200 hover:bg-slate-50"}`}
              >
                <div className="mb-3 flex size-10 items-center justify-center rounded-full bg-blue-50">
                  <UploadCloud className="text-primary size-5" />
                </div>
                <p className="mb-1 text-sm font-bold text-slate-700">
                  Arraste e solte o comprovante aqui
                </p>
                <p className="text-xs font-medium text-slate-400">
                  ou clique para selecionar um arquivo PDF de até 10 MB
                </p>
              </div>
            ) : (
              <div className="flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                    <CheckCircle2 className="size-4 text-emerald-600" />
                  </div>
                  <span className="truncate text-sm font-bold text-emerald-800">{file.name}</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={clearReceipt}
                  className="h-8 w-8 shrink-0 rounded-full text-emerald-600 hover:bg-emerald-100"
                >
                  <X className="size-4" />
                </Button>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex shrink-0 items-center justify-between gap-4 border-t border-slate-100 bg-slate-50 p-6">
          <DialogClose asChild>
            <Button
              variant="ghost"
              className="rounded-xl px-6 font-bold text-slate-500 hover:bg-slate-200"
              disabled={isPending}
            >
              Cancelar
            </Button>
          </DialogClose>
          <Button
            onClick={handleSubmit}
            disabled={!file || !selectedAccount || !paymentDate || isPending}
            className="h-11 flex-1 rounded-xl font-black shadow-sm"
            isLoading={isPending}
            loadingText="Enviando..."
          >
            Confirmar Pagamento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
