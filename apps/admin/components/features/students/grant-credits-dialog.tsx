"use client";

import { useRef, useState, useTransition } from "react";
import {
  getManualCreditGrantContext,
  grantManualCredits,
} from "@/app/actions/manual-credit-grants";
import type {
  ManualCreditGrantContext,
  ManualCreditGrantReason,
  ManualCreditGrantType,
} from "@repo/types";
import { manualCreditGrantSchema } from "@repo/validators";
import { formatDate } from "@repo/utils";
import { Alert, AlertDescription } from "@repo/ui/components/alert";
import { Button } from "@repo/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@repo/ui/components/dialog";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/select";
import { Textarea } from "@repo/ui/components/textarea";
import {
  Box,
  Gift,
  Heart,
  Infinity as InfinityIcon,
  Loader2,
  Megaphone,
  MoreHorizontal,
  RefreshCcw,
  Settings2,
  UsersRound,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const CREDIT_TYPE_LABELS: Record<ManualCreditGrantType, string> = {
  mentorship: "Crédito da mentoria",
  plan: "Crédito do plano",
  extra: "Crédito extra",
};

const CREDIT_TYPE_OPTIONS: Record<
  ManualCreditGrantType,
  { description: string; icon: LucideIcon; iconClassName: string }
> = {
  mentorship: {
    description: "Utilizado nas sessões de mentoria",
    icon: UsersRound,
    iconClassName: "bg-violet-100 text-violet-600",
  },
  plan: {
    description: "Utilizado conforme as regras do plano",
    icon: Box,
    iconClassName: "bg-blue-100 text-blue-600",
  },
  extra: {
    description: "Crédito adicional, não expira",
    icon: InfinityIcon,
    iconClassName: "bg-emerald-100 text-emerald-600",
  },
};

const REASON_LABELS: Record<ManualCreditGrantReason, string> = {
  mentorship_bonus: "Bônus da mentoria",
  administrative_adjustment: "Ajuste administrativo",
  technical_issue_compensation: "Compensação por problema técnico",
  credit_replacement: "Reposição de créditos",
  courtesy: "Cortesia",
  promotional_campaign: "Campanha promocional",
  other: "Outro motivo",
};

const REASON_OPTIONS: Record<
  ManualCreditGrantReason,
  { description: string; icon: LucideIcon; iconClassName: string }
> = {
  mentorship_bonus: {
    description: "Créditos adicionados como bônus da mentoria",
    icon: Gift,
    iconClassName: "bg-violet-100 text-violet-600",
  },
  administrative_adjustment: {
    description: "Ajuste pontual no saldo de créditos do aluno",
    icon: Settings2,
    iconClassName: "bg-blue-100 text-blue-600",
  },
  technical_issue_compensation: {
    description: "Compensação por problema técnico ou indisponibilidade",
    icon: Wrench,
    iconClassName: "bg-blue-100 text-blue-600",
  },
  credit_replacement: {
    description: "Reposição de créditos utilizados ou removidos",
    icon: RefreshCcw,
    iconClassName: "bg-amber-100 text-amber-600",
  },
  courtesy: {
    description: "Créditos adicionados como cortesia",
    icon: Heart,
    iconClassName: "bg-rose-100 text-rose-600",
  },
  promotional_campaign: {
    description: "Créditos adicionados por campanha promocional",
    icon: Megaphone,
    iconClassName: "bg-emerald-100 text-emerald-600",
  },
  other: {
    description: "Outro motivo registrado pelo administrador",
    icon: MoreHorizontal,
    iconClassName: "bg-slate-100 text-slate-600",
  },
};

const ALL_REASONS = Object.keys(REASON_LABELS) as ManualCreditGrantReason[];

function SelectOptionContent({
  description,
  icon: Icon,
  iconClassName,
  label,
}: {
  description: string;
  icon: LucideIcon;
  iconClassName: string;
  label: string;
}) {
  return (
    <span className="flex min-w-0 items-center gap-2.5 whitespace-normal">
      <span
        className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${iconClassName}`}
      >
        <Icon className="size-4.5" />
      </span>
      <span className="min-w-0 text-left">
        <span className="block text-sm font-semibold leading-5 text-slate-800">{label}</span>
        <span className="block text-xs leading-4 text-slate-500">{description}</span>
      </span>
    </span>
  );
}

function getCreditTypeDescription(
  type: ManualCreditGrantType,
  context: ManualCreditGrantContext
) {
  const availability = context.options[type];

  if (!availability.available) {
    return availability.unavailableReason || "Indisponível";
  }

  if (availability.expiresAt) {
    return `Segue o ciclo vigente · válido até ${formatDate(availability.expiresAt, "numeric")}`;
  }

  return CREDIT_TYPE_OPTIONS[type].description;
}

function getFirstAvailableType(context: ManualCreditGrantContext): ManualCreditGrantType {
  return (
    (["mentorship", "plan", "extra"] as const).find((type) => context.options[type].available) ??
    "extra"
  );
}

export function GrantCreditsDialog({
  studentId,
  disabled = false,
}: {
  studentId: string;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pending, startTransition] = useTransition();
  const [context, setContext] = useState<ManualCreditGrantContext | null>(null);
  const [step, setStep] = useState<"form" | "review">("form");
  const [operationId, setOperationId] = useState("");
  const [creditType, setCreditType] = useState<ManualCreditGrantType>("extra");
  const [amount, setAmount] = useState("1");
  const [reason, setReason] = useState<ManualCreditGrantReason>("courtesy");
  const [internalNote, setInternalNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const contextRequestRef = useRef<Promise<ManualCreditGrantContext> | null>(null);

  const selectedOption = context?.options[creditType];
  const parsedAmount = Number(amount);
  const noteRequired = ["administrative_adjustment", "other"].includes(reason);
  const availableReasons = ALL_REASONS.filter(
    (item) => item !== "mentorship_bonus" || creditType === "mentorship"
  );

  function resetForm(nextContext: ManualCreditGrantContext | null) {
    setStep("form");
    setOperationId(crypto.randomUUID());
    setCreditType(nextContext ? getFirstAvailableType(nextContext) : "extra");
    setAmount("1");
    setReason("courtesy");
    setInternalNote("");
    setError(null);
  }

  async function loadContext() {
    if (context) return context;
    if (contextRequestRef.current) return contextRequestRef.current;

    setLoading(true);
    const request = getManualCreditGrantContext(studentId);
    contextRequestRef.current = request;

    try {
      const nextContext = await request;
      setContext(nextContext);
      setCreditType(getFirstAvailableType(nextContext));
      if (nextContext.blocked) setError("A conta do aluno está bloqueada.");
      return nextContext;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível carregar os dados.");
      return null;
    } finally {
      contextRequestRef.current = null;
      setLoading(false);
    }
  }

  function changeOpen(nextOpen: boolean) {
    if (pending) return;
    setOpen(nextOpen);
    if (!nextOpen) return;
    resetForm(context);
    if (!context) window.setTimeout(() => void loadContext(), 0);
  }

  function buildInput() {
    return {
      operationId,
      studentId,
      creditType,
      amount: parsedAmount,
      reason,
      internalNote,
    };
  }

  function review() {
    if (!selectedOption?.available) {
      setError(selectedOption?.unavailableReason ?? "Este tipo de crédito não está disponível.");
      return;
    }

    const parsed = manualCreditGrantSchema.safeParse(buildInput());
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Confira os dados informados.");
      return;
    }

    setError(null);
    setStep("review");
  }

  function confirm() {
    startTransition(async () => {
      const result = await grantManualCredits(buildInput());
      if (!result.success) {
        setError(result.error);
        return;
      }

      toast.success("Créditos adicionados e registrados no histórico.");
      setContext(null);
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled}
          title={disabled ? "Contas bloqueadas não podem receber créditos." : undefined}
          className="max-w-full whitespace-normal"
          onPointerEnter={() => {
            if (!disabled) void loadContext();
          }}
          onFocus={() => {
            if (!disabled) void loadContext();
          }}
        >
          <Gift className="size-4.5" />
          Adicionar créditos
        </Button>
      </DialogTrigger>

      <DialogContent
        className="max-h-[90vh] overflow-y-auto rounded-3xl sm:max-w-xl"
        onInteractOutside={(event) => {
          if (pending) event.preventDefault();
        }}
        onEscapeKeyDown={(event) => {
          if (pending) event.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>Adicionar créditos</DialogTitle>
          <DialogDescription>
            {context
              ? `Para ${context.studentName}. A alteração ficará registrada no histórico.`
              : "Os saldos e ciclos do aluno estão sendo consultados."}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading && (
          <div className="flex min-h-48 items-center justify-center gap-2 text-sm text-slate-500">
            <Loader2 className="size-4 animate-spin" />
            Carregando saldos e ciclos...
          </div>
        )}

        {!loading && context && step === "form" && (
          <div className="space-y-5">
            <div className="space-y-2">
              <Label>Tipo de crédito</Label>
              <Select
                value={creditType}
                onValueChange={(value) => {
                  const nextType = value as ManualCreditGrantType;
                  setCreditType(nextType);
                  setError(null);
                  if (reason === "mentorship_bonus" && nextType !== "mentorship") {
                    setReason("courtesy");
                  }
                }}
              >
                <SelectTrigger className="h-auto min-h-11 w-full rounded-xl py-1.5 **:data-[slot=select-value]:flex-1 **:data-[slot=select-value]:line-clamp-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent
                  position="popper"
                  align="start"
                  sideOffset={6}
                  className="w-(--radix-select-trigger-width) rounded-xl **:data-[slot=select-viewport]:h-auto"
                >
                  {(Object.keys(CREDIT_TYPE_LABELS) as ManualCreditGrantType[]).map((type) => {
                    const option = CREDIT_TYPE_OPTIONS[type];
                    const availability = context.options[type];

                    return (
                      <SelectItem
                        key={type}
                        value={type}
                        disabled={!availability.available}
                        className="py-2.5 pr-9"
                      >
                        <SelectOptionContent
                          label={CREDIT_TYPE_LABELS[type]}
                          description={getCreditTypeDescription(type, context)}
                          icon={option.icon}
                          iconClassName={option.iconClassName}
                        />
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="manual-credit-amount">Quantidade</Label>
              <Input
                id="manual-credit-amount"
                inputMode="numeric"
                value={amount}
                onChange={(event) => {
                  setAmount(event.target.value.replace(/\D/g, "").slice(0, 3));
                  setError(null);
                }}
                onKeyDown={(event) => {
                  if (["e", "E", "+", "-", ".", ","].includes(event.key)) event.preventDefault();
                }}
                className="min-h-11 rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label>Motivo</Label>
              <Select
                value={reason}
                onValueChange={(value) => {
                  setReason(value as ManualCreditGrantReason);
                  setError(null);
                }}
              >
                <SelectTrigger className="h-auto min-h-11 w-full rounded-xl py-1.5 **:data-[slot=select-value]:flex-1 **:data-[slot=select-value]:line-clamp-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent
                  position="popper"
                  align="start"
                  sideOffset={6}
                  className="w-(--radix-select-trigger-width) rounded-xl **:data-[slot=select-viewport]:h-auto"
                >
                  {availableReasons.map((item) => {
                    const option = REASON_OPTIONS[item];

                    return (
                      <SelectItem key={item} value={item} className="py-2.5 pr-9">
                        <SelectOptionContent
                          label={REASON_LABELS[item]}
                          description={option.description}
                          icon={option.icon}
                          iconClassName={option.iconClassName}
                        />
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="manual-credit-note">
                Observação interna{noteRequired ? " *" : " (opcional)"}
              </Label>
              <Textarea
                id="manual-credit-note"
                value={internalNote}
                onChange={(event) => {
                  setInternalNote(event.target.value.slice(0, 1000));
                  setError(null);
                }}
                rows={4}
                placeholder="Visível somente para administradores."
                className="resize-y rounded-xl"
              />
              <p className="text-xs text-slate-500">{internalNote.length}/1000 caracteres</p>
            </div>
          </div>
        )}

        {!loading && context && step === "review" && (
          <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <h3 className="font-bold text-slate-800">Revise antes de confirmar</h3>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Aluno</dt>
                <dd className="text-right font-semibold text-slate-800">{context.studentName}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Crédito</dt>
                <dd className="font-semibold text-slate-800">{CREDIT_TYPE_LABELS[creditType]}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Quantidade</dt>
                <dd className="font-semibold text-emerald-700">+{parsedAmount}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Saldo</dt>
                <dd className="font-semibold text-slate-800">
                  {context.balances[creditType]} → {context.balances[creditType] + parsedAmount}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Motivo</dt>
                <dd className="text-right font-semibold text-slate-800">{REASON_LABELS[reason]}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Validade</dt>
                <dd className="text-right font-semibold text-slate-800">
                  {selectedOption?.expiresAt
                    ? formatDate(selectedOption.expiresAt, "numeric")
                    : "Sem vencimento"}
                </dd>
              </div>
              {internalNote.trim() && (
                <div className="border-t border-slate-200 pt-3">
                  <dt className="text-slate-500">Observação interna</dt>
                  <dd className="mt-1 font-medium whitespace-pre-wrap text-slate-800">
                    {internalNote.trim()}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        )}

        {!loading && context && (
          <DialogFooter>
            {step === "review" ? (
              <>
                <Button variant="outline" onClick={() => setStep("form")} disabled={pending}>
                  Voltar
                </Button>
                <Button onClick={confirm} isLoading={pending} loadingText="Adicionando...">
                  Adicionar créditos
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={review} disabled={!selectedOption?.available || context.blocked}>
                  Revisar
                </Button>
              </>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
