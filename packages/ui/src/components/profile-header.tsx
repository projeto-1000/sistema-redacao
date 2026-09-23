
'use client'
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

export function ProfileHeader({ user, creditBalanceComponent, secondaryAction }: ProfileHeaderProps) {
  const [isIdCopied, setIsIdCopied] = useState(false);

  const handleCopyId = async () => {
    await navigator.clipboard.writeText(user.id);

    setIsIdCopied(true);

    window.setTimeout(() => {
      setIsIdCopied(false);
    }, 2000);
  };

  return (
    <div className="grid grid-cols-min md:grid-cols-[auto_1fr] xl:grid-cols-[auto_1fr_auto] gap-4 items-center p-6 xl:p-10 bg-white rounded-3xl border border-slate-200 shadow-sm">

      <div className="justify-self-center md:justify-self-center xl:row-span-2">
        <Avatar
          src={user.avatarUrl}
          name={user.name}
          className="size-24 md:size-28 lg:size-30 xl:size-38 border-3 border-slate-200 shadow-md"
          textClassName="text-2xl md:text-4xl"
        />
      </div>

      <div className="flex flex-col gap-2 min-w-0 text-center items-center md:text-start md:items-start">
        <h2 className="text-2xl xl:text-3xl font-extrabold truncate">
          {user.name}
        </h2>

        {/* <div className="flex items-center gap-2 text-slate-500 bg-slate-50 px-3 py-1 rounded-full border border-slate-100 font-medium text-xs md:text-sm w-fit">
          <Mail className="size-3.5 shrink-0" />
          <span className="truncate">{user.email}</span>
        </div>

        <div className="flex items-center gap-1 text-[11px] font-medium text-slate-400">
          <span>ID: {formatShortId(user.id)}</span>

          <button
            type="button"
            onClick={handleCopyId}
            className="rounded p-0.5 transition-colors hover:bg-slate-100 hover:text-slate-600"
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
            <span className="text-slate-500 font-medium">ID:</span>

            <span className="font-semibold text-slate-600">
              {formatShortId(user.id)}
            </span>

            <button
              type="button"
              onClick={handleCopyId}
              className="rounded p-0.5 text-slate-400 transition-colors hover:text-slate-700"
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
        <div className="
            w-full sm:w-auto
            justify-self-center
            md:justify-self-start
            lg:justify-self-end

            md:col-start-2
            lg:col-start-3
            lg:row-start-1
          "
        >
          {creditBalanceComponent}
        </div>
      )}


      <div className="flex flex-wrap gap-3 flex-col md:flex-row w-full justify-self-center md:justify-self-start md:col-start-2 xl:col-start-2">
        <Button
          asChild
          className="h-11 rounded-2xl md:w-fit font-medium flex items-center justify-center"
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
            className="h-11 rounded-2xl md:w-fit font-medium flex items-center justify-center"
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