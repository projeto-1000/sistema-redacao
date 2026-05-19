"use client";

import { useState, useRef, useTransition, useEffect } from "react";
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@repo/ui/components/dialog";
import { Button } from "@repo/ui/components/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@repo/ui/components/dropdown-menu";
import { Banknote, Copy, UploadCloud, CheckCircle2, User, Receipt, FileText, X, KeyRound, Landmark, AlertCircle, ArrowRightLeft } from "lucide-react";
import { createTeacherPayment } from "@/app/actions/teacher-payments";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { AccountData, type PaymentMetrics } from "@/types";
import { maskPixKey } from "@repo/utils";

interface PaymentRegistrationModalProps {
  teacherId: string;
  month: string;
  metrics: PaymentMetrics;
  accounts: AccountData[];
}

export function PaymentRegistrationModal({
  teacherId, month, metrics, accounts
}: PaymentRegistrationModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedAccount, setSelectedAccount] = useState<AccountData | null>(() => {
    return accounts.find(a => a.is_default) || accounts[0] || null;
  });

  const formattedPeriod = format(parseISO(`${month}-01`), "MMMM / yyyy", { locale: ptBR });

  useEffect(() => {
    if (isOpen) {
      setSelectedAccount(accounts.find(a => a.is_default) || accounts[0] || null);
    }
  }, [isOpen, accounts]);

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
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
    formData.append("essaysCount", metrics.totalEssays.toString());
    formData.append("unitValue", metrics.valuePerCorrection.toString());
    formData.append("totalAmount", metrics.totalAmount.toString());

    startTransition(async () => {
      const result = await createTeacherPayment(formData);
      if (result.success) {
        toast.success("Pagamento registrado com sucesso!");
        setIsOpen(false);
        setFile(null);
      } else {
        toast.error(result.error || "Erro ao registrar pagamento.");
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="w-full h-14 rounded-2xl font-black text-sm shadow-sm">
          <Banknote className="size-5 mr-2" /> Registrar Pagamento Manual
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-md h-[90dvh] p-0 rounded-4xl border-none shadow-2xl bg-white overflow-hidden flex flex-col">
        <DialogHeader className="p-6 pb-4 border-b border-slate-50 flex items-center shrink-0">
          <DialogTitle className="text-xl font-black tracking-tight">
            Confirmar Pagamento
          </DialogTitle>
        </DialogHeader>

        <div className="p-6 space-y-6 no-scrollbar overflow-y-auto flex-1">

          <div className="bg-slate-100 border border-slate-200 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-4">
              <User className="size-4 text-blue-600" />
              <h4 className="text-sm font-bold text-slate-800">Dados do Titular</h4>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Nome Completo</p>
                <p className="text-sm font-bold text-slate-700 truncate" title={selectedAccount?.owner_name}>
                  {selectedAccount?.owner_name || 'Não cadastrado'}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">CPF / CNPJ</p>
                <p className="text-sm font-bold text-slate-700">
                  {selectedAccount?.owner_document || "Não informado"}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-slate-100 border border-slate-200 rounded-2xl p-4 flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <Receipt className="size-4 text-secondary" />
              <h4 className="text-sm font-bold text-slate-800">Resumo do Pagamento</h4>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Período Referência</p>
                <p className="text-sm font-bold text-slate-700 capitalize">{formattedPeriod}</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Redações Corrigidas</p>
                <p className="text-sm font-bold text-slate-700">{metrics.totalEssays}</p>
              </div>
            </div>

            <div className="mt-4 rounded-xl flex justify-end gap-6 items-end">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Valor Total</p>
              <p className="text-lg font-black text-secondary">R$ {metrics.totalAmount.toFixed(2).replace(".", ",")}</p>
            </div>
          </div>

          <div>
            {!selectedAccount ? (
              <div className="flex items-center gap-3 p-4 bg-orange-50 border border-orange-100 rounded-2xl text-orange-700">
                <AlertCircle className="size-5 shrink-0" />
                <p className="text-sm font-medium">Este professor ainda não cadastrou uma conta bancária padrão.</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-black text-slate-800 flex items-center gap-2">
                    {selectedAccount.type === 'pix' ? <KeyRound className="size-4 text-purple-600" /> : <Landmark className="size-4 text-blue-600" />}
                    Conta de Recebimento
                    {selectedAccount.is_default && (
                      <span className="text-[9px] bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded uppercase tracking-wider ml-1">Padrão</span>
                    )}
                  </h4>

                  {accounts.length > 1 && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-bold text-[14px]">
                          <ArrowRightLeft className="size-3.5" /> Trocar conta
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-[280px] rounded-xl p-1">
                        {accounts.map((acc, index) => (
                          <DropdownMenuItem
                            key={acc.id || index}
                            onClick={() => setSelectedAccount(acc)}
                            className={`flex flex-col items-start gap-1 p-3 cursor-pointer rounded-lg ${selectedAccount.id === acc.id ? 'bg-slate-50' : ''}`}
                          >
                            <div className="flex items-center justify-between w-full">
                              <span className="text-sm font-bold text-slate-800">
                                {acc.type === 'pix' ? 'Chave PIX' : acc.bank_name}
                              </span>
                              {acc.is_default && (
                                <span className="text-[9px] bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded uppercase tracking-wider">Padrão</span>
                              )}
                            </div>
                            <span className="text-xs font-medium text-slate-500">
                              {acc.type === 'pix' ? acc.pix_key : `Ag: ${acc.agency} | CC: ${acc.account_number}`}
                            </span>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>

                {selectedAccount.type === "pix" ? (
                  <div className="flex items-center gap-2">
                    <div className="flex-1 flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl h-11 px-3 overflow-hidden">
                      <span className="text-sm font-medium text-slate-600 truncate">
                        {maskPixKey(selectedAccount.pix_key ?? "", selectedAccount.pix_type ?? "cpf")}
                      </span>
                      <span className="bg-[#FDEEE3] text-[#C47E3A] text-[10px] font-black uppercase px-2 py-1 rounded-md tracking-wider shrink-0 ml-2">
                        {selectedAccount.pix_type}
                      </span>
                    </div>
                    <Button variant="secondary" onClick={handleCopyPix} className="h-11 rounded-xl shadow-sm shrink-0 text-[14px]">
                      <Copy className="size-3.5" /> Copiar
                    </Button>
                  </div>
                ) : (
                  <div className="relative group">
                    <Button variant="ghost" size="icon" onClick={handleCopyBank} className="absolute top-2 right-2 h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50 bg-white rounded-lg shadow-sm border border-slate-100 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      <Copy className="size-3.5" />
                    </Button>
                    <div className="grid grid-cols-2 gap-3 bg-slate-50 border border-slate-200 rounded-2xl p-4">
                      <div className="col-span-2">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Banco</p>
                        <p className="text-sm font-bold text-slate-700">{selectedAccount.bank_name}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Agência</p>
                        <p className="text-sm font-bold text-slate-700">{selectedAccount.agency}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Conta {selectedAccount.account_variant === 'poupanca' ? 'Poupança' : 'Corrente'}</p>
                        <p className="text-sm font-bold text-slate-700">{selectedAccount.account_number}</p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <div>
            <h4 className="text-sm font-black text-slate-800 mb-4 flex items-center gap-2">
              <FileText className="size-4 text-blue-600" /> Comprovante de Pagamento
            </h4>

            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept=".pdf, image/jpeg, image/png"
              onChange={handleFileChange}
            />

            {!file ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-slate-50 hover:border-blue-300 transition-colors"
              >
                <div className="size-10 rounded-full bg-blue-50 flex items-center justify-center mb-3">
                  <UploadCloud className="size-5 text-blue-600" />
                </div>
                <p className="text-sm font-bold text-slate-700 mb-1">
                  Arraste e solte o comprovante aqui
                </p>
                <p className="text-xs font-medium text-slate-400">
                  ou clique para selecionar um arquivo (PDF, JPG, PNG)
                </p>
              </div>
            ) : (
              <div className="border border-emerald-200 bg-emerald-50 rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="size-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="size-4 text-emerald-600" />
                  </div>
                  <span className="text-sm font-bold text-emerald-800 truncate">
                    {file.name}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setFile(null)}
                  className="text-emerald-600 hover:bg-emerald-100 rounded-full h-8 w-8 shrink-0"
                >
                  <X className="size-4" />
                </Button>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="p-6 border-t border-slate-100 flex items-center justify-between gap-4 bg-slate-50 shrink-0">
          <DialogClose asChild>
            <Button
              variant="ghost"
              className="text-slate-500 font-bold hover:bg-slate-200 rounded-xl px-6"
              disabled={isPending}
            >
              Cancelar
            </Button>
          </DialogClose>
          <Button
            variant='secondary'
            onClick={handleSubmit}
            disabled={!file || !selectedAccount || isPending}
            className="flex-1 font-black rounded-xl h-11 shadow-sm"
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