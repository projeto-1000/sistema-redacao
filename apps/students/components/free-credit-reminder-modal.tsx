"use client";

import { Button } from "@repo/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/dialog";
import {
  ArrowRight,
  CalendarDays,
  Coins,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { formatDate } from "@repo/utils";

interface FreeCreditReminderModalProps {
  open: boolean;
  freeCreditExpiresAt: string;
  onClose: () => void;
}


export function FreeCreditReminderModal({
  open,
  freeCreditExpiresAt,
  onClose,
}: FreeCreditReminderModalProps) {
  const formattedExpirationDate =
    formatDate(freeCreditExpiresAt, 'numeric');

  return (
    <Dialog open={open}>
      <DialogContent
        className="w-[calc(100%-4rem)] max-w-[560px] overflow-hidden rounded-3xl border-0 bg-white p-0 shadow-2xl"
        showCloseButton={false}
        onInteractOutside={(event) => event.preventDefault()}
        onEscapeKeyDown={(event) => event.preventDefault()}
      >
        <div className="bg-linear-to-br from-[#0f55de] to-[#042060] px-6 py-6 text-center text-white sm:px-8">
          <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/20">
            <Sparkles className="size-6" />
          </div>

          <DialogHeader className="mt-4 space-y-1.5 sm:text-center">
            <DialogTitle className="text-2xl leading-tight font-bold text-white">
              Você ganhou 1 correção gratuita
            </DialogTitle>

            <DialogDescription className="text-sm leading-relaxed text-blue-100">
              Envie sua primeira redação e receba uma correção completa dos nossos professores.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="space-y-4 px-6 py-5 sm:px-8">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex items-center gap-3 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white text-secondary shadow-sm">
                <Coins className="size-5" />
              </div>

              <div>
                <p className="text-xs text-slate-500">
                  Seu saldo inicial
                </p>

                <p className="mt-0.5 text-sm font-bold">
                  1 crédito gratuito
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white text-secondary shadow-sm">
                <CalendarDays className="size-5" />
              </div>

              <div>
                <p className="text-xs text-slate-500">
                  Válido até
                </p>

                <p className="mt-0.5 text-sm font-bold capitalize">
                  {formattedExpirationDate}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-slate-50 px-4 py-3 text-center">
            <p className="text-sm font-semibold text-slate-800">
              1 crédito = 1 correção
            </p>

            <p className="mt-1 text-xs leading-relaxed text-slate-500">
              Escolha um tema, escreva sua redação e use
              o crédito antes da data de validade.
            </p>
          </div>

          <Button
            type="button"
            variant="secondary"
            className="h-12 w-full rounded-xl text-sm font-bold sm:text-base"
            asChild
          >
            <Link
              href="/temas"
              onClick={onClose}
            >
              Escolher um tema
              <ArrowRight className="ml-1 size-4" />
            </Link>
          </Button>

          <div className="flex items-center justify-between gap-4 rounded-2xl border border-blue-100 bg-blue-50/60 px-4 py-3">
            <div>
              <h3 className="text-sm font-bold">
                Quer continuar evoluindo?
              </h3>

              <p className="mt-0.5 text-xs leading-relaxed text-slate-600 sm:text-sm">
                Conheça nossos planos e receba novos
                créditos para praticar todos os meses.
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0 rounded-xl border-none bg-transparent! font-bold text-[#0A4BCC] shadow-none"
              asChild
            >
              <Link
                href="/assinatura/planos"
                onClick={onClose}
              >
                Ver planos
                <ArrowRight className="ml-1 size-3.5" />
              </Link>
            </Button>
          </div>

          <Button
            type="button"
            onClick={onClose}
            variant="ghost"
            className="h-10 w-full rounded-xl text-sm font-semibold text-slate-500 hover:text-slate-800"
          >
            Explorar a plataforma
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}