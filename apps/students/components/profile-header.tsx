'use client'

import { useState } from "react";
import { Button } from "@repo/ui/components/button";
import { User, Mail, UserCog, LockKeyhole } from "lucide-react";
import { CreditBalance } from "@/components/credit-balance";
import { EditProfileModal } from "@/components/edit-profile-modal";
import { ResetPasswordModal } from "@/components/reset-password-modal";
import { UserData } from "@repo/types";
import Image from "next/image";
interface ProfileHeaderProps {
  user: UserData;
}

export function ProfileHeader({ user }: ProfileHeaderProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isResetOpen, setIsResetOpen] = useState(false);

  return (
    <>
      <div className="rounded-3xl p-8 md:p-10 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-8 md:gap-12 relative overflow-hidden bg-white">

        <div className="shrink-0 relative">
          <div className="size-32 md:size-40 rounded-full bg-slate-100 border-4 border-white shadow-md flex items-center justify-center overflow-hidden">
            {user.avatarUrl ? (

              <Image
                src={user.avatarUrl}
                alt="Foto de perfil"
                width={200}
                height={200}
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="size-16 text-slate-300" />
            )}
          </div>
        </div>

        <div className="flex-1 flex flex-col gap-4 items-center md:items-start text-center md:text-left w-full">
          <div className="flex flex-col md:flex-row w-full md:justify-between items-center md:items-start gap-4">

            <div className="flex flex-col items-center md:items-start gap-2">
              <h2 className="text-3xl font-extrabold">
                {user.name}
              </h2>

              <div className="flex items-center gap-2 text-slate-500 bg-slate-50 px-3 py-1 rounded-full border border-slate-100 font-medium">
                <Mail className="size-3.5" />
                {user.email}
              </div>
            </div>

            <CreditBalance amount={user.credits} />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <Button
              onClick={() => setIsEditOpen(true)}
              className="rounded-full font-bold h-11 px-6 shadow-md shadow-yellow-500/10"
            >
              <UserCog className="size-4.5 mr-2" />
              Editar informações
            </Button>
            {/* TODO: reset de senha */}
            {/* <Button
              onClick={() => setIsResetOpen(true)}
              variant="ghost"
              className="font-bold text-slate-600 bg-slate-100 hover:text-slate-900 hover:bg-slate-200 rounded-full h-11 px-6"
            >
              <LockKeyhole className="size-4.5 mr-2" />
              Redefinir senha
            </Button> */}
          </div>
        </div>
      </div>

      <EditProfileModal
        isOpen={isEditOpen}
        onClose={setIsEditOpen}
        initialData={user}
      />

      {/* <ResetPasswordModal
        isOpen={isResetOpen}
        onClose={setIsResetOpen}
        userEmail={user.email}
      /> */}
    </>
  );
}