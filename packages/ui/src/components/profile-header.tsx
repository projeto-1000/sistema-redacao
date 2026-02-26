'use client'

import { ReactNode } from "react";
import { User, Mail } from "lucide-react";

interface UserData {
  name: string;
  email: string;
  avatarUrl?: string | null;
}

interface ProfileHeaderProps {
  user: UserData;
  creditBalanceComponent?: ReactNode;
  actions?: ReactNode;
}

export function ProfileHeader({ user, creditBalanceComponent, actions }: ProfileHeaderProps) {
  return (
    <div className="rounded-3xl p-8 md:p-10 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-8 md:gap-12 relative overflow-hidden bg-white">
      <div className="shrink-0 relative">
        <div className="size-32 md:size-40 rounded-full bg-slate-100 border-4 border-white shadow-md flex items-center justify-center overflow-hidden">
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <User className="size-16 text-slate-300" />
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-4 items-center md:items-start text-center md:text-left w-full">
        <div className="flex flex-col md:flex-row w-full md:justify-between items-center md:items-start gap-4">
          <div className="flex flex-col items-center md:items-start gap-2">
            <h2 className="text-3xl font-extrabold text-slate-900">{user.name}</h2>
            <div className="flex items-center gap-2 text-slate-500 bg-slate-50 px-3 py-1 rounded-full border border-slate-100 font-medium text-sm">
              <Mail className="size-3.5" />
              {user.email}
            </div>
          </div>
          {creditBalanceComponent}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          {actions}
        </div>
      </div>
    </div>
  );
}