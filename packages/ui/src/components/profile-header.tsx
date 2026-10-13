"use client";
import { ReactNode, useState } from "react";
import { Check, Copy, CreditCard, Edit2, Mail } from "lucide-react";
import { formatShortId } from "@repo/utils";
import { Avatar } from "./avatar";
import { Button } from "./button";
import Link from "next/link";
interface UserData {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
}
interface ProfileHeaderAction {
  label: string;
  href: string;
}
interface ProfileHeaderProps {
  user: UserData;
  creditBalanceComponent?: ReactNode;
  secondaryAction?: ProfileHeaderAction;
}

export function ProfileHeader({
  user,
  creditBalanceComponent,
  secondaryAction,
}: ProfileHeaderProps) {
  const [isIdCopied, setIsIdCopied] = useState(false);

  const handleCopyId = async () => {
    await navigator.clipboard.writeText(user.id);

    setIsIdCopied(true);

    window.setTimeout(() => {
      setIsIdCopied(false);
    }, 2000);
  };

  return (
    <div className="grid grid-cols-1 items-center gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-[auto_1fr] xl:grid-cols-[auto_1fr_auto] xl:p-10">
      <div className="justify-self-center md:justify-self-center xl:row-span-2">
        <Avatar
          src={user.avatarUrl}
          name={user.name}
          className="size-24 border-3 border-slate-200 shadow-md md:size-28 lg:size-30 xl:size-38"
          textClassName="text-2xl md:text-4xl"
        />
      </div>

      <div className="flex min-w-0 flex-col items-center gap-2 text-center md:items-start md:text-start">
        <h2 className="truncate text-2xl font-extrabold xl:text-3xl">{user.name}</h2>

        {/* <div className="flex items-center gap-2 text-slate-500 bg-slate-50 px-3 py-1 rounded-full border border-slate-100 font-medium text-xs md:text-sm w-fit">
          <Mail className="size-3.5 shrink-0" />
          <span className="truncate">{user.email}</span>
        </div>

        <div className="flex items-center gap-1 text-[11px] font-medium text-slate-400">
          <span>ID: {formatShortId(user.id)}</span>

          <button
            type="button"
            onClick={handleCopyId}
            className="rounded-sm p-0.5 transition-colors hover:bg-slate-100 hover:text-slate-600"
            aria-label={isIdCopied ? "ID copiado" : "Copiar ID"}
            title={isIdCopied ? "ID copiado" : "Copiar ID"}
          >
            {isIdCopied ? (
              <Check className="size-3 text-emerald-600" />
            ) : (
              <Copy className="size-3" />
            )}
          </button>
        </div> */}

        <div className="flex flex-wrap items-center justify-center gap-2 md:justify-start">
          <div className="flex items-center gap-2 rounded-full border border-slate-100 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-500 md:text-sm">
            <Mail className="size-3.5 shrink-0" />
            <span className="truncate">{user.email}</span>
          </div>

          <div className="flex items-center gap-1.5 rounded-full border border-slate-100 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-500">
            <span className="font-medium text-slate-500">ID:</span>

            <span className="font-semibold text-slate-600">{formatShortId(user.id)}</span>

            <button
              type="button"
              onClick={handleCopyId}
              className="rounded-sm p-0.5 text-slate-400 transition-colors hover:text-slate-700"
              aria-label={isIdCopied ? "ID copiado" : "Copiar ID"}
              title={isIdCopied ? "ID copiado" : "Copiar ID"}
            >
              {isIdCopied ? (
                <Check className="size-3 text-emerald-600" />
              ) : (
                <Copy className="size-3" />
              )}
            </button>
          </div>
        </div>
      </div>

      {creditBalanceComponent && (
        <div className="w-full justify-self-center sm:w-auto md:col-start-2 md:justify-self-start lg:col-start-3 lg:row-start-1 lg:justify-self-end">
          {creditBalanceComponent}
        </div>
      )}

      <div className="flex w-full flex-col flex-wrap gap-3 justify-self-center md:col-start-2 md:flex-row md:justify-self-start xl:col-start-2">
        <Button
          asChild
          className="flex h-11 items-center justify-center rounded-2xl font-medium md:w-fit"
        >
          <Link href="/perfil/editar">
            <Edit2 className="size-4 shrink-0" />
            Editar perfil
          </Link>
        </Button>

        {secondaryAction && (
          <Button
            asChild
            variant="outline"
            className="flex h-11 items-center justify-center rounded-2xl font-medium md:w-fit"
          >
            <Link href={secondaryAction.href}>
              <CreditCard className="size-5 shrink-0" />
              {secondaryAction.label}
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}
