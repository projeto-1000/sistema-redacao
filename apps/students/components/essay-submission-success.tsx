"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@repo/ui/components/button";

interface EssaySubmissionSuccessProps {
  topicId: string;
  topicTitle: string;
}

export function EssaySubmissionSuccess({ topicId, topicTitle }: EssaySubmissionSuccessProps) {
  useEffect(() => {
    localStorage.removeItem(`@backup:${topicId}`);
  }, [topicId]);

  return (
    <div className="flex min-h-[calc(100dvh-8rem)] items-center justify-center py-6">
      <section className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-200 bg-white px-6 py-12 text-center shadow-lg shadow-slate-200/60 sm:px-12 sm:py-14">
        <div
          aria-hidden="true"
          className="bg-secondary/10 absolute -top-16 -left-16 size-40 rounded-full"
        />
        <div
          aria-hidden="true"
          className="bg-primary/20 absolute -right-20 -bottom-20 size-44 rounded-full"
        />

        <div className="relative mx-auto flex max-w-xl flex-col items-center">
          <div className="text-success mb-6 flex size-24 items-center justify-center rounded-full bg-emerald-100 sm:size-28">
            <CheckCircle2 className="size-14 sm:size-16" strokeWidth={2} />
          </div>

          <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
            Redação enviada!
          </h1>

          <p className="mt-5 text-base leading-relaxed font-medium text-slate-500 sm:text-lg">
            Sua redação sobre{" "}
            <span className="text-secondary font-bold italic">“{topicTitle}”</span> foi recebida e
            já está na fila de correção. Ela será enviada de volta para você em até 48h úteis.
          </p>

          <div className="mt-8 flex w-full flex-col-reverse justify-center gap-3 sm:w-auto sm:flex-row">
            <Button
              asChild
              variant="outline"
              className="h-12 rounded-2xl border-slate-300 px-6 font-bold"
            >
              <Link href="/inicio">Voltar ao início</Link>
            </Button>

            <Button asChild className="shadow-primary/20 h-12 rounded-2xl px-6 font-bold shadow-lg">
              <Link href="/minhas-redacoes">
                Ver minhas redações
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
