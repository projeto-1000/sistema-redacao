"use client";

import React, { useState } from "react";
import { Avatar } from "@repo/ui/components/avatar";
import { Button } from "@repo/ui/components/button";
import { USER_STATUS_MAP } from "@repo/constants";
import { Check, Copy, UserPen, UserLock, UserCheck } from "lucide-react";
import { formatDate, formatShortId } from "@repo/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@repo/ui/components/tooltip";
export interface BaseUserProfile {
  id: string;
  full_name: string;
  email: string;
  avatar_url?: string | null;
  status: string;
  created_at: string;
}

interface UserProfileHeaderProps {
  user: BaseUserProfile;
  onEdit?: () => void;
  onToggleStatus?: () => void;
  statusBadge?: React.ReactNode;
  statusDisplay?: { label: string; colors: string };
  footer?: React.ReactNode;
  disableAction?: boolean;
}

export function UserProfileHeader({
  user,
  onEdit,
  onToggleStatus,
  statusBadge,
  statusDisplay,
  footer,
  disableAction = false,
}: UserProfileHeaderProps) {
  const currentStatus =
    statusDisplay ||
    USER_STATUS_MAP[user.status as keyof typeof USER_STATUS_MAP] ||
    USER_STATUS_MAP.inactive;
  const isActive = user.status === "active";

  const [isIdCopied, setIsIdCopied] = useState(false);

  const handleCopyId = async () => {
    await navigator.clipboard.writeText(user.id);

    setIsIdCopied(true);

    window.setTimeout(() => {
      setIsIdCopied(false);
    }, 2000);
  };

  return (
    <div className="overflow-hidden rounded-4xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col items-center justify-between gap-6 p-6 md:flex-row md:p-8">
        <div className="flex flex-col items-center gap-6 text-center md:flex-row md:text-left">
          <Avatar
            src={user.avatar_url}
            name={user.full_name}
            className="size-30! border-3 border-slate-200 text-2xl shadow-md"
          />

          <div className="space-y-1.5">
            <h1 className="text-2xl leading-none font-black">{user.full_name}</h1>
            <p className="text-sm font-medium text-slate-500">{user.email}</p>

            <div className="flex items-center justify-center gap-1 text-xs font-medium text-slate-500 md:justify-start">
              <span>
                <strong>ID:</strong> {formatShortId(user.id)}
              </span>

              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={handleCopyId}
                    className="rounded-sm p-0.5 transition-colors hover:bg-slate-100 hover:text-slate-600"
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

            <div className="flex items-center justify-center gap-3 text-xs font-bold md:justify-start">
              <span
                className={`rounded-sm px-2 py-0.5 text-[10px] tracking-wider uppercase ${currentStatus.colors}`}
              >
                {currentStatus.label}
              </span>
              {statusBadge && (
                <>
                  <span className="text-slate-300">|</span>
                  {statusBadge}
                </>
              )}
              <span className="text-slate-300">|</span>
              <span className="text-slate-500">
                Desde: {formatDate(user.created_at, "numeric")}
              </span>
            </div>
          </div>
        </div>

        {disableAction === false && (
          <div className="flex w-full items-center gap-3 md:w-auto md:flex-col lg:flex-row">
            <Button
              onClick={onEdit}
              className="h-10 flex-1 rounded-xl font-medium transition-colors md:flex-none"
            >
              <UserPen className="mr-2 size-4" /> Editar Perfil
            </Button>

            <Button
              onClick={onToggleStatus}
              variant="outline"
              className={`h-10 flex-1 rounded-xl border-slate-200 font-medium transition-colors md:flex-none ${
                isActive
                  ? "hover:bg-red-100 hover:text-red-500"
                  : "hover:bg-green-100 hover:text-green-600"
              }`}
            >
              {isActive ? (
                <>
                  <UserLock className="mr-2 size-4.5" /> Bloquear
                </>
              ) : (
                <>
                  <UserCheck className="mr-2 size-4.5" /> Desbloquear
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      <div className="h-px w-full bg-slate-200" />

      {footer}
    </div>
  );
}
