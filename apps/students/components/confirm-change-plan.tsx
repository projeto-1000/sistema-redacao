"use client";

import { useState } from "react";
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
  ArrowRight,
  Info,
  Loader2,
  Calendar,
  DollarSign,
  RefreshCw
} from "lucide-react";
import { PlanData } from "@/types";

interface ConfirmChangePlanProps {
  newPlan: PlanData;
  currentPlanName: string;
  currentPlanEssays: number;
}

export function ConfirmChangePlan({
  newPlan,
  currentPlanName,
  currentPlanEssays,
}: ConfirmChangePlanProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"confirm" | "processing" | "success">("confirm");

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      // Pequeno delay para resetar o modal só depois que a animação de fechar acabar
      setTimeout(() => setStep("confirm"), 300);
    }
  };

  const handleConfirm = () => {
    setStep("processing");
    // Simulação de chamada de API/Stripe
    setTimeout(() => {
      setStep("success");
    }, 2000);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          className="w-full h-12 rounded-xl font-bold"
        >
          Selecionar Plano
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[520px] p-0 overflow-hidden border-none shadow-2xl">

        {/* PASSO 1: RESUMO DA ALTERAÇÃO */}
        {step === "confirm" && (
          <div className="p-8">
            <DialogHeader className="mb-8">
              <DialogTitle className="text-2xl font-extrabold text-slate-800 flex items-center gap-2">
                <div className="bg-blue-50 size-10 rounded-full flex items-center justify-center">
                  <RefreshCw className="size-5 text-blue-600" />
                </div>
                Alteração de Plano
              </DialogTitle>
              <p className="text-slate-500 font-medium">
                Confirme os detalhes da sua nova assinatura.
              </p>
            </DialogHeader>

            <div className="space-y-8">
              {/* Box de Comparação (Igual ao print) */}
              <div className="space-y-3">
                <p className="text-sm font-bold text-slate-600">
                  Você está alterando seu plano para o <span className="text-amber-600">{newPlan.name}</span>.
                </p>

                <div className="bg-[#FAF9F6] border border-stone-100 rounded-2xl p-6 flex items-center justify-between">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Plano Atual</span>
                    <span className="text-lg font-bold text-slate-700">{currentPlanName}</span>
                    <span className="text-xs font-medium text-slate-400">{currentPlanEssays} redações/mês</span>
                  </div>

                  <ArrowRight className="text-slate-300 size-6" />

                  <div className="flex flex-col gap-1 text-right">
                    <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">Novo Plano</span>
                    <span className="text-lg font-bold text-amber-600">{newPlan.name}</span>
                    <span className="text-xs font-bold text-amber-500/80">8 redações/mês</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-lg font-bold text-slate-800">Resumo do Faturamento</h4>

                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500 font-medium flex items-center gap-2">
                      <DollarSign className="size-4" /> Novo Valor Mensal
                    </span>
                    <span className="text-slate-800 font-extrabold">R$ {newPlan.price.toFixed(2).replace(".", ",")}</span>
                  </div>

                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500 font-medium flex items-center gap-2">
                      <Calendar className="size-4" /> Próxima Cobrança
                    </span>
                    <span className="text-slate-800 font-extrabold">15 de Novembro, 2023</span>
                  </div>
                </div>
              </div>

              {/* Info Alert Pro-rata */}
              <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-5 flex gap-4">
                <Info className="size-5 text-blue-500 shrink-0 mt-0.5" />
                <p className="text-xs leading-relaxed font-semibold text-blue-700/80">
                  O valor proporcional aos dias restantes do ciclo atual será cobrado imediatamente. Suas novas 8 redações estarão disponíveis assim que a alteração for confirmada.
                </p>
              </div>

              {/* Ações */}
              <div className="flex gap-3 pt-4">
                <Button variant="ghost" onClick={() => handleOpenChange(false)} className="flex-1 font-bold text-slate-500">
                  Cancelar
                </Button>
                <Button onClick={handleConfirm} className="flex-1 font-bold h-12 rounded-xl">
                  Confirmar Alteração
                </Button>
              </div>
            </div>
          </div>
        )}

        {step === "processing" && (
          <div className="p-20 flex flex-col items-center justify-center gap-4 text-center">
            <Loader2 className="size-12 text-primary animate-spin" />
            <p className="text-slate-600 font-bold">Processando alteração de plano...</p>
            <p className="text-slate-400 text-xs">Isso leva apenas alguns segundos.</p>
          </div>
        )}

        {step === "success" && (
          <div className="p-12 flex flex-col items-center text-center">
            <div className="bg-green-50 size-20 rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 className="size-12 text-success" />
            </div>

            <h2 className="text-2xl font-extrabold text-slate-800 mb-4">
              Plano Alterado!
            </h2>

            <p className="text-slate-500 font-medium leading-relaxed mb-8">
              Parabéns! Sua assinatura foi atualizada para o <strong className="text-slate-700">{newPlan.name}</strong>.
              Seus créditos serão adicionados à sua conta assim que o pagamento for processado.
            </p>

            <Button onClick={() => handleOpenChange(false)} className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold h-12 rounded-xl">
              Voltar para página inicial
            </Button>
          </div>
        )}

      </DialogContent>
    </Dialog>
  );
}