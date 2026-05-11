"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@repo/ui/components/dialog";
import { Button } from "@repo/ui/components/button";
import {
  CheckCircle2,
  CreditCard,
  ArrowRight,
  Info,
  Loader2
} from "lucide-react";
import { CreditPackage } from "@repo/types";
import { getUserCredits } from "@/app/actions/credits";


interface ConfirmPurchaseProps {
  packageData: CreditPackage;
}

export function ConfirmPurchase({ packageData }: ConfirmPurchaseProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"confirm" | "processing" | "success">("confirm");

  const [currentBalance, setCurrentBalance] = useState<number>(0);

  useEffect(() => {
    if (open) {
      getUserCredits().then(setCurrentBalance);
    }
  }, [open]);

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setTimeout(() => setStep("confirm"), 300);
    }
  };

  const handleConfirm = () => {
    setStep("processing");
    setTimeout(() => {
      setStep("success");
    }, 1500);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="w-full h-12 rounded-xl font-bold text-base">
          Adicionar
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden border-none shadow-2xl">

        {step === "confirm" && (
          <div className="p-8">
            <DialogHeader className="mb-8">
              <DialogTitle className="text-2xl font-extrabold text-slate-800">
                Confirmar Compra
              </DialogTitle>
              <p className="text-slate-500 font-medium">
                Confirme os detalhes da sua aquisição de créditos.
              </p>
            </DialogHeader>

            <div className="space-y-6">
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 flex items-center justify-between">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Saldo Atual</span>
                  <span className="text-lg font-bold text-slate-600">{currentBalance} Créditos Extra</span>
                </div>
                <ArrowRight className="text-slate-300 size-6" />
                <div className="flex flex-col gap-1 text-right">
                  <span className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">Novo Saldo</span>
                  <span className="text-lg font-bold text-blue-600">{currentBalance + packageData.credits} Créditos Extra</span>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Resumo do Faturamento</h4>
                <div className="flex justify-between items-center py-2">
                  <span className="text-slate-600 font-bold">{packageData.name}</span>
                  <span className="text-slate-800 font-extrabold">R$ {packageData.price.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-t border-slate-100">
                  <span className="text-slate-500 text-sm font-medium flex items-center gap-2">
                    <CreditCard className="size-4" /> Cartão de crédito final 4432
                  </span>
                </div>
              </div>

              <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 flex gap-3">
                <Info className="size-5 text-blue-500 shrink-0" />
                <p className="text-xs leading-relaxed font-semibold text-blue-700/80">
                  Ao confirmar, a cobrança será realizada no seu método de pagamento padrão. Os créditos avulsos não possuem validade.
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="ghost" onClick={() => handleOpenChange(false)} className="flex-1 font-bold text-slate-500">
                  Cancelar
                </Button>
                <Button onClick={handleConfirm} className="flex-1 font-bold">
                  Confirmar Compra
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* PASSO EM PROCESSAMENTO */}
        {step === "processing" && (
          <div className="p-16 flex flex-col items-center justify-center gap-4 text-center">
            <Loader2 className="size-12 text-amber-500 animate-spin" />
            <p className="text-slate-600 font-bold">Processando seu pagamento...</p>
          </div>
        )}

        {/* PASSO 2: SUCESSO */}
        {step === "success" && (
          <div className="p-10 flex flex-col items-center text-center">
            <div className="bg-green-50 size-20 rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 className="size-12 text-green-500" />
            </div>

            <h2 className="text-2xl font-extrabold text-slate-800 mb-4">
              Pedido Recebido!
            </h2>

            <p className="text-slate-500 font-medium leading-relaxed mb-8">
              Seu pagamento está sendo processado. Assim que for confirmado pelo seu banco, os
              <strong className="text-slate-700"> {packageData.credits} créditos </strong>
              serão adicionados automaticamente à sua conta.
            </p>

            <div className="w-full bg-slate-50 rounded-2xl p-4 mb-8 text-sm font-bold text-slate-400 flex items-center justify-center gap-2">
              <Info className="size-4" /> Geralmente leva menos de 1 minuto.
            </div>

            <Button onClick={() => handleOpenChange(false)} className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold h-12 rounded-xl">
              Entendido
            </Button>
          </div>
        )}

      </DialogContent>
    </Dialog>
  );
}