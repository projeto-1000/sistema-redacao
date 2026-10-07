"use client";

import { useSubscriptionSupport } from "@/hooks/use-subscription-support";
import { SUBSCRIPTION_SUPPORT_ACTIONS } from "@/constants/subscription-support";
import type { SubscriptionSupportAction } from "@repo/types";
import { Button } from "@repo/ui/components/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@repo/ui/components/sheet";
import { RadioGroup, RadioGroupItem } from "@repo/ui/components/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/select";
import { Input } from "@repo/ui/components/input";
import { CurrencyInput } from "@repo/ui/components/currency-input";
import { Skeleton } from "@repo/ui/components/skeleton";
import { Label } from "@repo/ui/components/label";
import { Textarea } from "@repo/ui/components/textarea";
import { Alert, AlertDescription } from "@repo/ui/components/alert";
import { formatCurrency, formatDate } from "@repo/utils";
import { CalendarClock, CircleDollarSign, Gift, Loader2, RefreshCcw } from "lucide-react";
import { SubscriptionSupportSummary } from "./subscription-support-summary";
import { SubscriptionSupportStepper } from "./subscription-support-stepper";
import { SubscriptionSupportContextCard } from "./subscription-support-context-card";

const actionIcons = {
  cancel_only: CalendarClock,
  cancel_refund: CircleDollarSign,
  refund_courtesy: Gift,
  refund_only: RefreshCcw,
};

export function SubscriptionSupportSheet({ studentId }: { studentId: string }) {
  const form = useSubscriptionSupport(studentId);
  const context = form.context;
  const summary = context && (
    <SubscriptionSupportSummary
      action={form.action}
      amount={form.amount ?? 0}
      context={context}
      payment={form.payment}
      reason={form.reason}
      courtesyCredits={Number(form.courtesyCredits)}
      courtesyUntil={form.courtesyUntil}
    />
  );
  return (
    <Sheet open={form.open} onOpenChange={form.changeOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          className="w-full bg-white"
          onMouseEnter={form.preload}
          onFocus={form.preload}
        >
          <CircleDollarSign className="size-4" />
          Cancelar ou reembolsar
        </Button>
      </SheetTrigger>
      <SheetContent
        onInteractOutside={(event) => {
          if (form.pending) event.preventDefault();
        }}
        onEscapeKeyDown={(event) => {
          if (form.pending) event.preventDefault();
        }}
      >
        <header className="shrink-0 pr-8">
          <SheetTitle className="text-xl font-bold text-slate-800">
            Cancelar ou reembolsar
          </SheetTitle>
          <SheetDescription className="mt-1 text-sm text-slate-500">
            Atendimento em nome do aluno. Revise as consequências antes de confirmar.
          </SheetDescription>
        </header>
        <div className="mt-5 flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto pr-1 [&>*]:shrink-0">
          {form.error && (
            <Alert variant="destructive">
              <AlertDescription>{form.error}</AlertDescription>
            </Alert>
          )}
          {!context && form.loading && (
            <>
              <SubscriptionSupportContextCard context={null} />
              <SubscriptionSupportStepper step={1} />
              <Skeleton className="h-24 w-full rounded-xl" />
              <Skeleton className="h-24 w-full rounded-xl" />
            </>
          )}
          {context && (
            <>
              <SubscriptionSupportContextCard context={context} />
              {context.pendingOperation ? (
                <Alert>
                  <AlertDescription className="space-y-3">
                    <p>
                      Já existe um atendimento em processamento:{" "}
                      {SUBSCRIPTION_SUPPORT_ACTIONS[context.pendingOperation.action].label}.
                    </p>
                    <p>
                      Verificar consulta a Pagar.me, sem enviar outro reembolso. Se houver falha,
                      mantenha o registro e investigue antes de uma nova ação.
                    </p>
                    <Button onClick={form.verify} disabled={form.pending}>
                      Verificar confirmação
                    </Button>
                  </AlertDescription>
                </Alert>
              ) : (
                <>
                  <SubscriptionSupportStepper step={form.step} />
                  {form.step === 1 && (
                    <RadioGroup
                      value={form.action}
                      onValueChange={(value) => form.setAction(value as SubscriptionSupportAction)}
                    >
                      {Object.entries(SUBSCRIPTION_SUPPORT_ACTIONS).map(([value, config]) => {
                        const Icon = actionIcons[value as SubscriptionSupportAction];
                        return (
                          <Label
                            key={value}
                            htmlFor={`support-${value}`}
                            className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors ${form.action === value ? "border-blue-400 bg-blue-50 shadow-sm ring-1 ring-blue-100" : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"}`}
                          >
                            <RadioGroupItem
                              value={value}
                              id={`support-${value}`}
                              className="mt-2"
                            />
                            <span
                              className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${form.action === value ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-500"}`}
                            >
                              <Icon className="size-5" />
                            </span>
                            <span className="min-w-0">
                              <span className="block font-semibold">{config.label}</span>
                              <span className="mt-1 block text-xs leading-relaxed font-normal text-slate-500">
                                {config.description}
                              </span>
                            </span>
                          </Label>
                        );
                      })}
                    </RadioGroup>
                  )}
                  {form.step === 2 && (
                    <div className="space-y-5">
                      <div className="space-y-2">
                        <Label>Cobrança do ciclo atual</Label>
                        <Select value={form.paymentId} onValueChange={form.setPaymentId}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Selecione uma cobrança" />
                          </SelectTrigger>
                          <SelectContent>
                            {context.payments.map((payment) => (
                              <SelectItem key={payment.id} value={payment.id}>
                                {formatCurrency(payment.amount)} ·{" "}
                                {formatDate(payment.paid_at, "numeric")}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {form.payment && (
                          <p className="text-xs text-slate-500">
                            {form.payment.credits_amount ?? "Não registrado"} créditos
                            disponibilizados neste pagamento. Saldo atual:{" "}
                            {context.availableCredits}.
                          </p>
                        )}
                        {!context.payments.length && (
                          <p className="text-sm text-red-600">
                            Não foi encontrado um pagamento atribuível à contratação atual.
                          </p>
                        )}
                      </div>
                      {form.action !== "cancel_only" && (
                        <div className="space-y-2">
                          <Label>Valor do reembolso</Label>
                          <RadioGroup
                            value={form.partial ? "partial" : "full"}
                            onValueChange={(value) => form.setPartial(value === "partial")}
                            className="grid grid-cols-2 gap-3"
                          >
                            <Label
                              htmlFor="refund-full"
                              className={`flex items-center gap-2 rounded-lg border p-3 ${!form.partial ? "border-blue-300 bg-blue-50 text-blue-700" : "border-slate-200"}`}
                            >
                              <RadioGroupItem id="refund-full" value="full" />
                              Integral
                            </Label>
                            <Label
                              htmlFor="refund-partial"
                              className={`flex items-center gap-2 rounded-lg border p-3 ${form.partial ? "border-blue-300 bg-blue-50 text-blue-700" : "border-slate-200"}`}
                            >
                              <RadioGroupItem id="refund-partial" value="partial" />
                              Parcial
                            </Label>
                          </RadioGroup>
                          <CurrencyInput
                            aria-label="Valor do reembolso em reais"
                            value={form.amount ?? null}
                            readOnly={!form.partial}
                            className={!form.partial ? "bg-slate-50 text-slate-600" : ""}
                            onValueChange={(cents) =>
                              form.setPartialAmount(cents === null ? "" : (cents / 100).toFixed(2))
                            }
                          />
                          <p className="text-xs text-slate-500">
                            {form.partial
                              ? "Digite o valor em reais e centavos."
                              : "Será devolvido o valor integral da cobrança selecionada."}{" "}
                            {form.payment &&
                              `Valor da cobrança: ${formatCurrency(form.payment.amount)}.`}
                          </p>
                        </div>
                      )}
                      {form.action === "refund_courtesy" && (
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="courtesy-credits">Créditos mantidos</Label>
                            <Input
                              id="courtesy-credits"
                              type="number"
                              min={0}
                              max={context.availableCredits}
                              value={form.courtesyCredits}
                              onChange={(event) => form.setCourtesyCredits(event.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="courtesy-until">Validade da cortesia</Label>
                            <Input
                              id="courtesy-until"
                              type="date"
                              value={form.courtesyUntil}
                              onChange={(event) => form.setCourtesyUntil(event.target.value)}
                            />
                          </div>
                          <p className="text-xs text-slate-500 sm:col-span-2">
                            Não serão criados novos créditos. A validade não pode ultrapassar o
                            período pago.
                          </p>
                        </div>
                      )}
                      <div className="space-y-2">
                        <Label htmlFor="support-reason">
                          Motivo do atendimento / referência do chamado
                        </Label>
                        <Textarea
                          id="support-reason"
                          value={form.reason}
                          onChange={(event) => form.setReason(event.target.value)}
                          maxLength={1000}
                          placeholder="Explique o pedido do aluno e o acordo feito pelo suporte."
                        />
                        <p className="text-xs text-slate-500">
                          Esta justificativa ficará disponível também no histórico do aluno.
                        </p>
                      </div>
                      {summary}
                    </div>
                  )}
                  {form.step === 3 && summary}
                </>
              )}
            </>
          )}
        </div>
        {context && !context.pendingOperation && (
          <footer className="mt-5 flex shrink-0 flex-col-reverse gap-3 border-t pt-4 sm:flex-row sm:justify-between">
            <Button
              variant="outline"
              disabled={form.pending}
              onClick={() =>
                form.step === 1 ? form.changeOpen(false) : form.setStep(form.step - 1)
              }
            >
              Voltar
            </Button>
            <Button
              className="h-auto min-h-10 whitespace-normal"
              disabled={form.pending || form.loading || !context.payments.length}
              onClick={
                form.step === 1
                  ? () => form.setStep(2)
                  : form.step === 2
                    ? form.review
                    : form.confirm
              }
            >
              {form.pending && <Loader2 className="mr-2 size-4 animate-spin" />}
              {form.step === 1
                ? "Continuar"
                : form.step === 2
                  ? "Revisar atendimento"
                  : `Confirmar: ${SUBSCRIPTION_SUPPORT_ACTIONS[form.action].label.toLowerCase()}`}
            </Button>
          </footer>
        )}
      </SheetContent>
    </Sheet>
  );
}
