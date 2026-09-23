import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  FilePenLine,
  RotateCcw,
} from "lucide-react";
import { Button } from "@repo/ui/components/button";
import { RETURN_REASON_LABELS } from "../../constants";

interface ReturnedEssayCardProps {
  essayId: string;
  topicId: string;
  reason: string;
  description?: string | null;
}

export default function ReturnedEssayCard({
  essayId,
  topicId,
  reason,
  description,
}: ReturnedEssayCardProps) {

  const reasonLabel = RETURN_REASON_LABELS[reason] || reason;

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-red-100 bg-red-50/50 p-6">
        <div className="flex items-center gap-4">
          <div className="rounded-2xl bg-white p-3 text-red-600 shadow-sm">
            <AlertCircle className="size-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold tracking-tight">
              Redação devolvida
            </h3>
            <p className="text-sm font-medium text-slate-500">
              Seu crédito foi devolvido e você pode tentar novamente.
            </p>
          </div>
        </div>

        <div className="mt-5 border-t border-red-100 pt-4">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Motivo da devolução
          </span>
          <p className="mt-1 text-[16px] font-semibold text-slate-800">
            {reasonLabel}
          </p>
        </div>

        {description?.trim() && (
          <div className="mt-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Observações do professor
            </span>
            <p className="mt-1 text-sm font-medium leading-relaxed text-slate-700">
              {description}
            </p>
          </div>
        )}
      </div>

      <div className="p-6">
        <span className="inline-flex rounded-full bg-[#EBC84C]/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#8B781F]">
          Recomendação
        </span>
        <h3 className="mt-3 text-lg font-bold tracking-tight text-slate-900">
          Como você quer continuar?
        </h3>
        <p className="mt-1 text-sm font-medium leading-relaxed text-slate-500">
          Escolha o que deseja reaproveitar na próxima versão.
        </p>

        <div className="mt-5 flex flex-col gap-3">
          <Button
            asChild
            className="h-auto min-h-16 w-full justify-start rounded-2xl px-4 py-3 text-left shadow-sm"
          >
            <Link
              href={`/minhas-redacoes/nova-redacao?id=${topicId}&mode=reuse&source=${essayId}`}
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-slate-900/10">
                <RotateCcw className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-bold">
                  Revisar e reenviar esta redação
                </span>
                <span className="block whitespace-normal text-xs font-medium opacity-70">
                  Mantém o tema e recupera todo o texto
                </span>
              </span>
              <ArrowRight className="size-4 opacity-60" />
            </Link>
          </Button>

          <Button
            asChild
            variant="outline"
            className="h-auto min-h-16 w-full justify-start rounded-2xl px-4 py-3 text-left text-[#1E3A8A] shadow-none hover:border-blue-200 hover:bg-blue-50 hover:text-blue-900"
          >
            <Link
              href={`/minhas-redacoes/nova-redacao?id=${topicId}&mode=blank`}
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-blue-50">
                <FilePenLine className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-bold text-slate-800">
                  Escrever novamente sobre este tema
                </span>
                <span className="block whitespace-normal text-xs font-medium text-slate-500">
                  Mantém o tema e começa com o texto em branco
                </span>
              </span>
              <ArrowRight className="size-4 text-slate-400" />
            </Link>
          </Button>

          <Button
            asChild
            variant="link"
            className="h-auto w-fit justify-start px-1 py-2 font-bold text-[#1E3A8A]"
          >
            <Link href="/temas">
              Escolher um novo tema
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
