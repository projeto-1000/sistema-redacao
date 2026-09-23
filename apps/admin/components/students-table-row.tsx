"use client";

import { Check, Copy, Eye, UserCheck, UserX } from "lucide-react";
import { Avatar } from "@repo/ui/components/avatar";
import { Button } from "@repo/ui/components/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@repo/ui/components/tooltip";
import { updateStudentStatus } from "@/app/actions/students";
import Link from "next/link";
import { StudentsListItem } from "@/types";
import { useToggleUserStatus } from "@/hooks/use-toggle-user-status";
import { formatDate, formatShortId } from "@repo/utils";
import { useState } from "react";
import { toast } from "sonner";
import { STUDENTS_TABLE_GRID } from "./students-table-layout";

const CREDIT_STYLES: Record<string, string> = {
  Plano: "border-blue-100 bg-blue-50/60 text-blue-700",
  Extra: "border-violet-100 bg-violet-50/60 text-violet-700",
  Gratuito: "border-emerald-100 bg-emerald-50/60 text-emerald-700",
  Mentoria: "border-amber-100 bg-amber-50/60 text-amber-700",
};

export function StudentsTableRow({ student }: { student: StudentsListItem }) {
  const { entity: studentItem, toggleStatus } = useToggleUserStatus(student, updateStudentStatus);
  const [isIdCopied, setIsIdCopied] = useState(false);

  const getPlanPeriodLabel = () => {
    if (!studentItem.plan || studentItem.plan.interval === "lifetime") {
      return null;
    }

    if (studentItem.plan.interval === "month" && studentItem.plan.interval_count === 3) {
      return "Trimestral";
    }

    if (studentItem.plan.interval === "month" && studentItem.plan.interval_count === 1) {
      return "Mensal";
    }

    if (studentItem.plan.interval === "day" && studentItem.plan.interval_count) {
      return `${studentItem.plan.interval_count} dia${studentItem.plan.interval_count > 1 ? "s" : ""
        }`;
    }

    return null;
  };

  const isFreePlan =
    studentItem.plan?.name === "Plano Gratuito" || studentItem.plan?.interval === "lifetime";
  const planName = isFreePlan ? "Gratuito" : studentItem.plan?.name || "Sem plano";
  const periodLabel = getPlanPeriodLabel();
  const periodStart = formatDate(studentItem.subscription?.current_period_start, "compact");
  const periodEnd = formatDate(studentItem.subscription?.current_period_end, "compact");
  const hasValidity = Boolean(
    studentItem.subscription?.current_period_start && studentItem.subscription?.current_period_end
  );

  const validityLabel = isFreePlan
    ? "Sem vencimento"
    : hasValidity
      ? `${periodStart} – ${periodEnd}`
      : "Sem vigência";

  const credits = [
    { label: "Plano", value: studentItem.credits.plan },
    { label: "Extra", value: studentItem.credits.extra },
    { label: "Gratuito", value: studentItem.credits.free },
    { label: "Mentoria", value: studentItem.credits.mentorship },
  ]
    .filter((credit) => credit.value > 0)
    .map((credit) => ({
      ...credit,
      className: CREDIT_STYLES[credit.label],
    }));

  const situation = (() => {
    if (studentItem.status === "blocked") {
      return {
        label: "Bloqueado",
        colors: "bg-red-50 text-red-600",
      };
    }

    switch (studentItem.subscription?.status) {
      case "active":
      case "trial":
        return {
          label: "Plano ativo",
          colors: "bg-emerald-50 text-emerald-600",
        };
      case "past_due":
      case "unpaid":
        return {
          label: "Inadimplente",
          colors: "bg-amber-50 text-amber-700",
        };
      case "canceled":
        return {
          label: "Cancelado",
          colors: "bg-slate-100 text-slate-600",
        };
      default:
        return {
          label: "Sem plano",
          colors: "bg-blue-50 text-blue-600",
        };
    }
  })();

  const handleCopyId = async () => {
    try {
      await navigator.clipboard.writeText(studentItem.id);
      setIsIdCopied(true);
      window.setTimeout(() => setIsIdCopied(false), 2000);
    } catch {
      toast.error("Não foi possível copiar o ID.");
    }
  };

  return (
    <div
      className={`grid items-center p-5 transition-colors hover:bg-slate-50/50 lg:px-3 lg:py-4 xl:px-8 ${STUDENTS_TABLE_GRID}`}
    >
      <div className="flex min-w-0 items-center gap-4 lg:gap-3 xl:gap-4">
        <Avatar
          src={studentItem.avatar_url}
          name={studentItem.full_name}
          className="size-10 shrink-0"
        />

        <div className="min-w-0">
          <p className="truncate text-sm leading-tight font-bold">{studentItem.full_name}</p>
          <p className="truncate text-xs text-slate-500 lg:text-[11px] xl:text-xs">
            {studentItem.email}
          </p>
          <div className="mt-1 flex items-center gap-1 text-[12px] font-medium text-slate-400 lg:text-[11px] xl:text-[12px]">
            <span>ID: {formatShortId(studentItem.id)}</span>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={handleCopyId}
                  className="rounded p-0.5 transition-colors hover:bg-slate-100 hover:text-slate-600"
                  aria-label={isIdCopied ? "ID copiado" : "Copiar ID"}
                >
                  {isIdCopied ? (
                    <Check className="size-3 text-emerald-600" />
                  ) : (
                    <Copy className="size-3" />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent className="rounded-lg border-none bg-slate-900 text-xs font-medium text-white">
                <p>{isIdCopied ? "ID copiado" : "Copiar ID"}</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>

      <div className="flex min-w-0 items-center justify-between lg:justify-center">
        <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase lg:hidden">
          Cadastro
        </span>
        <span className="text-sm font-semibold text-slate-600">
          {formatDate(studentItem.created_at, "compact")}
        </span>
      </div>

      <div className="flex min-w-0 items-center justify-between lg:justify-center">
        <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase lg:hidden">
          Plano e vigência
        </span>
        <div className="max-w-full min-w-0 text-right lg:text-center">
          <div className="flex max-w-full flex-wrap items-center justify-end lg:justify-center xl:flex-nowrap">
            <span className="min-w-0 text-sm font-bold wrap-break-word text-slate-700 lg:text-[13px] xl:text-sm">
              {planName}
            </span>
            {periodLabel && (
              <>
                <span
                  className="mx-1.5 h-4 w-px shrink-0 bg-slate-200 xl:mx-2"
                  aria-hidden="true"
                />

                <span className="shrink-0 text-xs font-semibold text-blue-600">
                  {periodLabel}
                </span>
              </>
            )}
          </div>
          <p className="mt-0.5 text-xs font-medium whitespace-nowrap text-slate-400">
            {validityLabel}
          </p>
        </div>
      </div>

      <div className="flex min-w-0 items-center justify-between lg:justify-center">
        <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase lg:hidden">
          Créditos
        </span>
        {credits.length > 0 ? (
          <div className="flex min-w-0 flex-wrap items-center justify-end gap-1 lg:justify-center xl:gap-1.5">
            {credits.map((credit) => (
              <div
                key={credit.label}
                className={`rounded-lg border px-1.5 py-1.5 whitespace-nowrap lg:px-1.5 xl:px-2 xl:py-0.5 ${credit.className}`}
              >
                <span className="text-sm font-bold lg:text-xs xl:text-sm">{credit.value}</span>
                <span className="ml-1 text-xs font-semibold lg:text-[11px] xl:text-xs">
                  {credit.label}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <span className="text-xs font-semibold text-slate-400">0 créditos</span>
        )}
      </div>

      <div className="flex min-w-0 items-center justify-between lg:justify-center">
        <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase lg:hidden">
          Última atividade
        </span>
        <div className="min-w-0 text-right lg:text-center">
          {studentItem.last_activity ? (
            <>
              <p className="text-sm font-semibold text-slate-600 lg:text-xs xl:text-sm">
                {formatDate(studentItem.last_activity.date, "compact")}
              </p>
              <p className="mt-0.5 text-xs font-medium wrap-break-word text-slate-400 lg:text-[11px] xl:text-xs">
                {studentItem.last_activity.type === "submission"
                  ? "Enviou redação"
                  : "Recebeu correção"}
              </p>
            </>
          ) : (
            <>
              <p className="text-sm font-semibold text-slate-400 lg:text-xs xl:text-sm">—</p>
              <p className="mt-0.5 text-xs font-medium wrap-break-word text-slate-400 lg:text-[11px]">
                Sem atividade registrada
              </p>
            </>
          )}
        </div>
      </div>

      <div className="flex min-w-0 items-center justify-between lg:justify-center">
        <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase lg:hidden">
          Status
        </span>
        <span
          className={`inline-flex h-7 min-w-24 items-center justify-center rounded-md px-2 text-center text-[10px] font-bold tracking-wider whitespace-nowrap uppercase xl:px-3 ${situation.colors}`}
        >
          {situation.label}
        </span>
      </div>

      <div className="mt-2 flex min-w-0 justify-end border-t border-slate-100 pt-4 lg:mt-0 lg:border-t-0 lg:pt-0">
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-lg text-slate-400 transition-colors hover:bg-blue-50 hover:text-blue-600"
                asChild
              >
                <Link href={`/alunos/${studentItem.id}`}>
                  <Eye className="size-4.5" />
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent className="rounded-lg border-none bg-slate-900 text-xs font-medium text-white">
              <p>Ver Detalhes</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-lg text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                onClick={toggleStatus}
              >
                {studentItem.status === "active" ? (
                  <UserX className="size-4.5" />
                ) : (
                  <UserCheck className="size-4.5" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent className="rounded-lg border-none bg-slate-900 text-xs font-medium text-white">
              <p>{studentItem.status === "active" ? "Bloquear" : "Ativar"}</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </div>
  );
}
