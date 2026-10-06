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
import { Label } from "@repo/ui/components/label";
import { Textarea } from "@repo/ui/components/textarea";
import { Alert, AlertDescription } from "@repo/ui/components/alert";
import { formatCurrency, formatDate } from "@repo/utils";
import { Loader2 } from "lucide-react";
import { SubscriptionSupportSummary } from "./subscription-support-summary";

export function SubscriptionSupportSheet({ studentId }: { studentId: string }) {
  const form = useSubscriptionSupport(studentId);
  const context = form.context;
  const summary = context && (
    <SubscriptionSupportSummary
      action={form.action}
      amount={form.amount ?? 0}
      availableCredits={context.availableCredits}
      periodEnd={context.periodEnd}
      courtesyCredits={Number(form.courtesyCredits)}
      courtesyUntil={form.courtesyUntil}
    />
  );
  return (
    <Sheet open={form.open} onOpenChange={form.changeOpen}>
      <SheetTrigger asChild>
        <Button variant="outline">Cancelar ou reembolsar</Button>
      </SheetTrigger>
      <SheetContent
        onInteractOutside={(event) => {
          if (form.pending) event.preventDefault();
        }}
        onEscapeKeyDown={(event) => {
          if (form.pending) event.preventDefault();
        }}
      >
        <header className="pr-8">
          <SheetTitle className="text-xl font-bold text-slate-800">
            Cancelar ou reembolsar
          </SheetTitle>
          <SheetDescription className="mt-1 text-sm text-slate-500">
            Atendimento em nome do aluno. Revise as consequências antes de confirmar.
          </SheetDescription>
        </header>
        <div className="mt-5 flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto pr-1">
          {form.error && (
            <Alert variant="destructive">
              <AlertDescription>{form.error}</AlertDescription>
            </Alert>
          )}
          {!context && form.pending && (
            <p className="flex items-center gap-2 text-sm">
              <Loader2 className="size-4 animate-spin" />
              Carregando atendimento…
            </p>
          )}
          {context && (
            <>
              <div className="rounded-xl border border-slate-200 p-4 text-sm">
                <p className="font-bold">{context.name}</p>
                <p className="text-slate-500">{context.email}</p>
                <p className="mt-2">
                  {context.planName} · {context.availableCredits} créditos disponíveis
                </p>
                <p className="text-slate-500">
                  Disponibilizados: {context.grantedCredits ?? "Não registrado"} · Utilizados:{" "}
                  {context.usedCredits ?? "Não registrado"}
                </p>
                <p className="text-slate-500">
                  Período pago até {formatDate(context.periodEnd, "date-time")}
                </p>
              </div>
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
                  <ol
                    className="flex gap-4 text-xs text-slate-500"
                    aria-label="Etapas do atendimento"
                  >
                    {["Tipo de ação", "Detalhes", "Confirmação"].map((label, index) => (
                      <li
                        key={label}
                        aria-current={form.step === index + 1 ? "step" : undefined}
                        className={form.step === index + 1 ? "font-bold text-blue-700" : ""}
                      >
                        {index + 1}. {label}
                      </li>
                    ))}
                  </ol>
                  {form.step === 1 && (
                    <RadioGroup
                      value={form.action}
                      onValueChange={(value) => form.setAction(value as SubscriptionSupportAction)}
                    >
                      {Object.entries(SUBSCRIPTION_SUPPORT_ACTIONS).map(([value, config]) => (
                        <Label
                          key={value}
                          htmlFor={`support-${value}`}
                          className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 ${form.action === value ? "border-blue-300 bg-blue-50" : "border-slate-200"}`}
                        >
                          <RadioGroupItem
                            value={value}
                            id={`support-${value}`}
                            className="mt-0.5"
                          />
                          <span>
                            <span className="block font-semibold">{config.label}</span>
                            <span className="mt-1 block text-xs leading-relaxed font-normal text-slate-500">
                              {config.description}
                            </span>
                          </span>
                        </Label>
                      ))}
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
                            className="flex gap-4"
                          >
                            <Label className="flex items-center gap-2">
                              <RadioGroupItem value="full" />
                              Integral
                            </Label>
                            <Label className="flex items-center gap-2">
                              <RadioGroupItem value="partial" />
                              Parcial
                            </Label>
                          </RadioGroup>
                          {form.partial && (
                            <Input
                              aria-label="Valor parcial em reais"
                              inputMode="decimal"
                              placeholder="Ex.: 20,00"
                              value={form.partialAmount}
                              onChange={(event) => form.setPartialAmount(event.target.value)}
                            />
                          )}
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
                  {form.step === 3 && (
                    <>
                      {summary}
                      <div className="rounded-xl border p-4 text-sm">
                        <p className="font-semibold">Justificativa registrada</p>
                        <p className="mt-2 whitespace-pre-wrap">{form.reason}</p>
                      </div>
                      <Alert>
                        <AlertDescription>
                          Ao confirmar, esta ação será enviada à Pagar.me. A devolução só será
                          marcada como concluída após confirmação.
                        </AlertDescription>
                      </Alert>
                    </>
                  )}
                </>
              )}
            </>
          )}
        </div>
        {context && !context.pendingOperation && (
          <footer className="mt-5 flex flex-col-reverse gap-3 border-t pt-4 sm:flex-row sm:justify-between">
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
              disabled={form.pending || !context.payments.length}
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
