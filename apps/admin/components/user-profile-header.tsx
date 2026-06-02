import React from "react";
import { Avatar } from "@repo/ui/components/avatar";
import { UserPen, UserLock, UserCheck } from "lucide-react";
import { Button } from "@repo/ui/components/button";
import { formatDate } from "@repo/utils";
import { USER_STATUS_MAP } from "@repo/constants";

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
  footer?: React.ReactNode;
  disableAction?: boolean
}

export function UserProfileHeader({
  user,
  onEdit,
  onToggleStatus,
  footer,
  disableAction = false
}: UserProfileHeaderProps) {

  const currentStatus = USER_STATUS_MAP[user.status as keyof typeof USER_STATUS_MAP] || USER_STATUS_MAP.inactive;
  const isActive = user.status === 'active';

  return (
    <div className="bg-white border border-slate-200 rounded-4xl shadow-sm overflow-hidden">

      <div className="p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">

        <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
          <Avatar
            src={user.avatar_url}
            name={user.full_name}
            className="size-30! text-2xl border-3 border-slate-200 shadow-md"
          />

          <div className="space-y-1.5">
            <h1 className="text-2xl font-black leading-none">{user.full_name}</h1>
            <p className="text-sm font-medium text-slate-500">{user.email}</p>

            <div className="flex items-center justify-center md:justify-start gap-3 text-xs font-bold">

              <span className={`px-2 py-0.5 rounded text-[10px] uppercase tracking-wider ${currentStatus.colors}`}>
                {currentStatus.label}
              </span>
              <span className="text-slate-300">|</span>
              <span className="text-slate-500">Desde: {formatDate(user.created_at, 'numeric')}</span>
            </div>
          </div>
        </div>

        {disableAction === false && (
          <div className="flex items-center gap-3 w-full md:w-auto md:flex-col lg:flex-row">
            <Button onClick={onEdit} className="flex-1 md:flex-none h-10 rounded-xl font-medium transition-colors">
              <UserPen className="size-4 mr-2" /> Editar Perfil
            </Button>

            <Button
              onClick={onToggleStatus}
              variant="outline"
              className={`flex-1 md:flex-none h-10 rounded-xl border-slate-200 font-medium transition-colors ${isActive
                ? 'hover:bg-red-100 hover:text-red-500'
                : 'hover:bg-green-100 hover:text-green-600'
                }`}
            >
              {isActive ? (
                <><UserLock className="size-4.5 mr-2" /> Bloquear</>
              ) : (
                <><UserCheck className="size-4.5 mr-2" /> Desbloquear</>
              )}
            </Button>
          </div>
        )}
      </div>

      <div className="h-px bg-slate-200 w-full" />

      {footer}
    </div>
  );
}