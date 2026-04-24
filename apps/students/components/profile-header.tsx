'use client'

import { useState } from "react";
import { Button } from "@repo/ui/components/button";
import { User, Mail, CreditCard } from "lucide-react";
import { EditProfileModal } from "@/components/edit-profile-modal";
import { UserData } from "@repo/types";
import Image from "next/image";
import { CreditsCard } from "./credits-card";
interface ProfileHeaderProps {
  user: UserData;
}

export function ProfileHeader({ user }: ProfileHeaderProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isResetOpen, setIsResetOpen] = useState(false);

  return (
    <>
      <div className="rounded-4xl p-6 md:p-8 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8 relative overflow-hidden bg-white">

        {/* 1. FOTO DE PERFIL */}
        <div className="shrink-0 relative">
          <div className="size-28 md:size-32 rounded-full bg-slate-50 border-4 border-white shadow-md flex items-center justify-center overflow-hidden">
            {user.avatarUrl ? (
              <Image
                src={user.avatarUrl}
                alt="Foto de perfil"
                width={128}
                height={128}
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="size-12 text-slate-300" />
            )}
          </div>
        </div>

        <div className="flex-1 flex flex-col w-full gap-6">

          <div className="flex flex-col xl:flex-row xl:justify-between items-center xl:items-start gap-6 w-full">
            <div className="flex flex-col items-center xl:items-start gap-1 md:gap-2 text-center xl:text-left">
              <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                {user.name}
              </h2>

              <a
                href="#!"
                onClick={(e) => e.preventDefault()}
                className="flex items-center gap-2 text-slate-500 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100 font-medium text-sm cursor-default"
              >
                <Mail className="size-3.5 md:size-4" />
                {user.email}
              </a>
            </div>


            <div className="shrink-0">
              <CreditsCard credits={user.credits} />
            </div>
          </div>

          <div className="flex flex-wrap justify-center xl:justify-start gap-3 w-full mt-auto">

            <EditProfileModal
              isOpen={isEditOpen}
              onClose={setIsEditOpen}
              initialData={user}
              onClick={() => setIsEditOpen(true)}
            />


            <Button
              variant="outline"
              className="rounded-xl font-bold h-11 border-slate-200 text-slate-700 transition-colors"
            >
              <CreditCard className="size-5 mr-2 text-slate-400" />
              Gerenciar assinatura
            </Button>

            {/* TODO: */}
            {/* <Button
              onClick={() => setIsResetOpen(true)}
              variant="ghost"
              className="font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-full h-11 px-6"
            >
              <LockKeyhole className="size-4.5 mr-2" />
              Redefinir senha
            </Button> */}
          </div>
        </div>
      </div>


      {/* <ResetPasswordModal
        isOpen={isResetOpen}
        onClose={setIsResetOpen}
        userEmail={user.email}
      /> */}
    </>

  );
}