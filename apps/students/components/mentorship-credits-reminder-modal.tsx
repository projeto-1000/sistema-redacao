"use client";

import { Button } from "@repo/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/dialog";
import { ArrowRight, Coins } from "lucide-react";
import Link from "next/link";

interface MentorshipCreditsReminderModalProps {
  open: boolean;
  onClose: () => void;
}

export function MentorshipCreditsReminderModal({
  open,
  onClose,
}: MentorshipCreditsReminderModalProps) {

  return (
    <Dialog open={open}>
      <DialogContent
        className="w-[calc(100%-4rem)] max-w-[560px] overflow-hidden rounded-3xl border-0 bg-white p-0 shadow-2xl"
        showCloseButton={false}
        onInteractOutside={(event) =>
          event.preventDefault()
        }
        onEscapeKeyDown={(event) =>
          event.preventDefault()
        }
      >
        <div className="bg-linear-to-br from-[#0f55de] to-[#042060] px-6 py-6 text-center text-white sm:px-8">
          <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/20">
            <Coins className="size-6" />
          </div>

          <DialogHeader className="mt-4 space-y-1.5 sm:text-center">
            <DialogTitle className="text-2xl leading-tight font-bold text-white">
              Você já tem 2 créditos disponíveis
            </DialogTitle>

            <DialogDescription className="text-sm leading-relaxed text-blue-100">
              Use seus créditos nas redações propostas durante a
              mentoria e acompanhe sua evolução a cada correção.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="space-y-4 px-6 py-4 sm:px-8">
          <div>
            <p className="mb-3 text-center text-sm font-semibold text-slate-800">
              Sua liberação de créditos
            </p>

            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-xl border border-blue-100 bg-blue-50 px-2 py-3 text-center">
                <p className="text-xs text-slate-500">
                  Agora
                </p>

                <p className="mt-0.5 text-sm font-bold text-[#0A4BCC]">
                  2 créditos
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 px-2 py-3 text-center">
                <p className="text-xs text-slate-500">
                  Próximo mês
                </p>

                <p className="mt-0.5 text-sm font-bold text-slate-800">
                  2 créditos
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 px-2 py-3 text-center">
                <p className="text-xs text-slate-500">
                  Último mês
                </p>

                <p className="mt-0.5 text-sm font-bold text-slate-800">
                  1 crédito
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-slate-50 px-4 py-3 text-center">
            <p className="text-sm font-semibold text-slate-800">
              1 crédito = 1 correção
            </p>

            <p className="mt-1 text-xs leading-relaxed text-slate-500">
              Os créditos não acumulam para o próximo
              ciclo.
            </p>
          </div>

          <div className="flex items-center justify-between gap-4 rounded-2xl border border-blue-100 bg-blue-50/60 px-4 py-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Quer continuar praticando?
              </h3>

              <p className="mt-0.5 text-xs leading-relaxed text-slate-600 sm:text-sm">
                Assine um plano para receber mais créditos e enviar
                outras redações além das propostas na mentoria.
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0 rounded-xl bg-transparent! font-bold text-[#0A4BCC] border-none shadow-none"
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
            variant="secondary"
            className="h-11 w-full rounded-xl text-sm font-bold sm:text-base"
          >
            Entendi, vamos começar
            <ArrowRight className="ml-1 size-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}