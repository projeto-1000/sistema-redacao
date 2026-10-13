import { ActionCard } from "@/components/action-card";
import { NextEssays } from "@/components/next-essays";
import { getProfileData } from "@/app/actions/profile";
import { formatDate } from "@repo/utils";
import { ArrowRight, Calendar, CheckCircle2, Clock, History, MoreHorizontal } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Início",
};

export default async function DashboardPage() {
  const data = await getProfileData();

  if (!data) return null;

  return (
    <div className="space-y-8 px-4 py-4 md:px-10 lg:px-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Olá, {data.user.name}!</h1>
        <div className="mt-1 flex items-center gap-2 text-slate-500">
          <Calendar className="size-4" />
          <span className="capitalize">{formatDate(new Date(), "full")}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <ActionCard
          href="/redacoes-pendentes"
          title="Ver Pendentes"
          description="Continuar de onde parou"
          icon={MoreHorizontal}
          bgIcon={Clock}
          variant="primary"
        />
        <ActionCard
          href="/redacoes-corrigidas"
          title="Ver Histórico"
          description="Revisar correções anteriores"
          icon={CheckCircle2}
          bgIcon={History}
          variant="secondary"
        />
      </div>

      <div>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-800">Próximas Redações</h3>
          <Link
            href="/redacoes-pendentes"
            prefetch={false}
            className="flex items-center gap-1 text-sm font-semibold text-blue-600 hover:underline"
          >
            Ver todas <ArrowRight className="size-4" />
          </Link>
        </div>

        <NextEssays />
      </div>
    </div>
  );
}
