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
  Loader2,
  Calendar,
  DollarSign,
  RefreshCw,
  CircleAlert,
} from "lucide-react";
import { PlanData } from "@/types";
import {
  executePlanUpgrade,
  getPlanDowngradePreview,
  getPlanUpgradePreview,
  schedulePlanDowngrade,
  type PlanDowngradePreview,
} from "@/app/actions/plan-change";

import { formatCurrency, formatDate } from "@repo/utils";

import type { PlanUpgradeCalculation } from "@/utils/calculate-plan-upgrade";
import { useRouter } from "next/navigation";
interface ConfirmChangePlanProps {
  newPlan: PlanData;

  currentPlanName: string;
  currentPlanPrice: number;
  currentPlanCreditsIncluded: number;

  currentPeriodStart: string;
  currentPeriodEnd: string;

  initialUpgradePreview?: PlanUpgradeCalculation | null;
}

export function ConfirmChangePlan({
  newPlan,
  currentPlanName,
  currentPlanPrice,
  currentPlanCreditsIncluded,
  currentPeriodEnd,
  initialUpgradePreview,
}: ConfirmChangePlanProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"confirm" | "processing" | "success">("confirm");
  const [isRedirecting, setIsRedirecting] = useState(false);
  const router = useRouter();

  const isDowngrade = newPlan.price < currentPlanPrice;

  const [upgradePreview, setUpgradePreview] = useState<PlanUpgradeCalculation | null>(
    initialUpgradePreview ?? null
  );

  const [downgradePreview, setDowngradePreview] = useState<PlanDowngradePreview | null>(null);

  const [previewError, setPreviewError] = useState<string | null>(null);

  const [, setIsLoadingPreview] = useState(false);

  async function loadUpgradePreview() {
    setIsLoadingPreview(true);
    setPreviewError(null);

    try {
      const preview = await getPlanUpgradePreview(newPlan.id);

      setUpgradePreview(preview);
    } catch (error) {
      setUpgradePreview(null);

      setPreviewError(
        error instanceof Error ? error.message : "Não foi possível calcular a alteração do plano."
      );
    } finally {
      setIsLoadingPreview(false);
    }
  }

  async function loadDowngradePreview() {
    setIsLoadingPreview(true);
    setPreviewError(null);

    try {
      const preview = await getPlanDowngradePreview(newPlan.id);

      if (!preview) {
        throw new Error("Não foi possível validar o downgrade.");
      }

      setDowngradePreview(preview);
    } catch (error) {
      setDowngradePreview(null);

      setPreviewError(
        error instanceof Error ? error.message : "Não foi possível calcular a alteração do plano."
      );
    } finally {
      setIsLoadingPreview(false);
    }
  }

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);

    if (isOpen) {
      if (isDowngrade) {
        void loadDowngradePreview();

        return;
      }

      if (initialUpgradePreview) {
        setUpgradePreview(initialUpgradePreview);
        setPreviewError(null);

        return;
      }

      void loadUpgradePreview();

      return;
    }

    setTimeout(() => {
      setStep("confirm");

      setUpgradePreview(initialUpgradePreview ?? null);

      setDowngradePreview(null);
      setPreviewError(null);
    }, 300);
  };

  const handleConfirm = async () => {
    setStep("processing");
    setPreviewError(null);

    const result = isDowngrade
      ? await schedulePlanDowngrade(newPlan.id)
      : await executePlanUpgrade(newPlan.id);

    if (!result.success) {
      setPreviewError(result.message);
      setStep("confirm");

      return;
    }

    setStep("success");
  };

  const handleCloseAfterSuccess = () => {
    if (isRedirecting) return;

    setIsRedirecting(true);
    router.push("/assinatura");
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && (step === "processing" || step === "success")) {
          return;
        }

        handleOpenChange(nextOpen);
      }}
    >
      <DialogTrigger asChild>
        <Button className="h-12 w-full rounded-xl font-bold">Selecionar Plano</Button>
      </DialogTrigger>

      <DialogContent className="overflow-hidden border-none p-0 shadow-2xl sm:max-w-130">
        {step === "confirm" && (
          <div className="p-8">
            <DialogHeader className="mb-8">
              <DialogTitle className="flex items-center gap-2 text-2xl font-extrabold text-slate-800">
                <div className="flex size-10 items-center justify-center rounded-full bg-blue-50">
                  <RefreshCw className="size-5 text-blue-600" />
                </div>
                Alteração de Plano
              </DialogTitle>
              <p className="font-medium text-slate-500">
                Confirme os detalhes da sua nova assinatura.
              </p>
            </DialogHeader>

            <div className="space-y-8">
              <div className="space-y-3">
                <p className="text-sm font-bold text-slate-600">
                  Você está alterando seu plano para o{" "}
                  <span className="text-amber-600">{newPlan.name}</span>.
                </p>

                <div className="flex items-center justify-between rounded-2xl border border-stone-100 bg-[#FAF9F6] p-6">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                      Plano Atual
                    </span>
                    <span className="text-lg font-bold text-slate-700">{currentPlanName}</span>
                    <span className="text-xs font-medium text-slate-400">
                      {currentPlanCreditsIncluded} redações/mês
                    </span>
                  </div>

                  <ArrowRight className="size-6 text-slate-300" />

                  <div className="flex flex-col gap-1 text-right">
                    <span className="text-[10px] font-bold tracking-widest text-amber-500 uppercase">
                      Novo Plano
                    </span>
                    <span className="text-lg font-bold text-amber-600">{newPlan.name}</span>
                    <span className="text-xs font-bold text-amber-500/80">
                      {newPlan.credits_included} redações/mês
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-lg font-bold text-slate-800">Resumo do faturamento</h4>

                <div className="space-y-3">
                  {isDowngrade ? (
                    <>
                      <div className="flex items-center justify-between gap-4 text-sm">
                        <span className="flex items-center gap-2 font-medium text-slate-500">
                          <DollarSign className="size-4" />
                          Cobrança agora
                        </span>

                        <span className="font-extrabold text-slate-800">R$ 0,00</span>
                      </div>

                      <div className="flex items-center justify-between gap-4 text-sm">
                        <span className="flex items-center gap-2 font-medium text-slate-500">
                          <Calendar className="size-4" />
                          Alteração do plano
                        </span>

                        <span className="font-extrabold text-slate-800">
                          {downgradePreview
                            ? formatDate(downgradePreview.currentPeriodEnd, "numeric")
                            : "Carregando..."}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-4 text-sm">
                        <span className="flex items-center gap-2 font-medium text-slate-500">
                          <RefreshCw className="size-4" />
                          Próximo valor mensal
                        </span>

                        <span className="font-extrabold text-slate-800">
                          {formatCurrency(newPlan.price)}
                        </span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center justify-between gap-4 text-sm">
                        <span className="flex items-center gap-2 font-medium text-slate-500">
                          <DollarSign className="size-4" />
                          Valor do novo plano
                        </span>

                        <span className="font-extrabold text-slate-800">
                          {upgradePreview
                            ? formatCurrency(upgradePreview.originalAmount)
                            : "Calculando..."}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-4 text-sm">
                        <span className="flex items-center gap-2 font-medium text-slate-500">
                          <DollarSign className="size-4" />
                          Crédito pelo saldo atual
                        </span>

                        <span className="font-extrabold text-emerald-700">
                          {upgradePreview
                            ? `- ${formatCurrency(upgradePreview.financialCredit)}`
                            : "Calculando..."}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-4 text-sm">
                        <span className="flex items-center gap-2 font-medium text-slate-500">
                          <DollarSign className="size-4" />
                          Cobrança agora
                        </span>

                        <span className="font-extrabold text-slate-800">
                          {upgradePreview
                            ? formatCurrency(upgradePreview.proratedAmount)
                            : "Calculando..."}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-4 text-sm">
                        <span className="flex items-center gap-2 font-medium text-slate-500">
                          <RefreshCw className="size-4" />
                          Novo valor mensal
                        </span>

                        <span className="font-extrabold text-slate-800">
                          {formatCurrency(newPlan.price)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-4 text-sm">
                        <span className="flex items-center gap-2 font-medium text-slate-500">
                          <Calendar className="size-4" />
                          Próxima cobrança
                        </span>

                        <span className="font-extrabold text-slate-800">
                          {formatDate(currentPeriodEnd, "numeric")}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {isDowngrade ? (
                <p className="text-xs leading-relaxed font-semibold text-blue-700/80">
                  Seu plano atual continuará ativo até{" "}
                  <strong>
                    {formatDate(downgradePreview?.currentPeriodEnd ?? currentPeriodEnd, "numeric")}
                  </strong>
                  . Nessa data, sua assinatura será alterada para o plano{" "}
                  <strong>{newPlan.name}</strong>, sem cobrança ou retirada de créditos agora.
                </p>
              ) : (
                <p className="text-xs leading-relaxed font-semibold text-blue-700/80">
                  Após a confirmação, você receberá mais{" "}
                  <strong>{upgradePreview?.additionalCredits ?? 0} créditos</strong> válidos até{" "}
                  <strong>{formatDate(currentPeriodEnd, "numeric")}</strong>. O saldo restante da
                  assinatura será abatido da cobrança, sem alterar sua data de renovação.
                </p>
              )}

              {previewError && (
                <div className="flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
                  <CircleAlert className="mt-0.5 size-5 shrink-0 text-red-600" />

                  <p className="text-sm leading-relaxed font-medium text-red-700">{previewError}</p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button
                  variant="ghost"
                  onClick={() => handleOpenChange(false)}
                  className="flex-1 font-bold text-slate-500"
                >
                  Cancelar
                </Button>
                <Button onClick={handleConfirm} className="h-12 flex-1 rounded-xl font-bold">
                  Confirmar Alteração
                </Button>
              </div>
            </div>
          </div>
        )}

        {step === "processing" && (
          <div className="flex flex-col items-center justify-center gap-4 p-20 text-center">
            <Loader2 className="text-primary size-12 animate-spin" />
            <p className="font-bold text-slate-600">Processando alteração de plano...</p>
            <p className="text-xs text-slate-400">Isso leva apenas alguns segundos.</p>
          </div>
        )}

        {step === "success" && (
          <div className="flex flex-col items-center p-12 text-center">
            <div className="mb-6 flex size-20 items-center justify-center rounded-full bg-green-50">
              <CheckCircle2 className="text-success size-12" />
            </div>

            <h2 className="mb-4 text-2xl font-extrabold text-slate-800">Plano Alterado!</h2>

            <p className="mb-8 leading-relaxed font-medium text-slate-500">
              {isDowngrade ? (
                <>
                  Seu plano atual continuará ativo até{" "}
                  <strong className="text-slate-700">
                    {formatDate(downgradePreview?.currentPeriodEnd ?? currentPeriodEnd, "numeric")}
                  </strong>
                  . Nessa data, sua assinatura será alterada para o plano{" "}
                  <strong className="text-slate-700">{newPlan.name}</strong>.
                </>
              ) : (
                <>
                  Sua assinatura foi atualizada para o plano{" "}
                  <strong className="text-slate-700">{newPlan.name}</strong>, e os créditos
                  adicionais já foram liberados.
                </>
              )}
            </p>

            <Button
              onClick={handleCloseAfterSuccess}
              className="h-12 w-full rounded-xl bg-slate-800 font-bold text-white hover:bg-slate-900"
            >
              Ver minha assinatura
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
