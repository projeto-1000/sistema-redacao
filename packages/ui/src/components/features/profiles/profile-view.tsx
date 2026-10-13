"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@repo/ui/components/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@repo/ui/components/alert-dialog";
import { ProfileForm } from "./profile-form";
import { PasswordForm } from "./password-form";
import { UserData } from "@repo/types";

export type ActionResponse = {
  success: boolean;
  error?: string;
  avatarUrl?: string;
};
interface EditProfileViewProps {
  initialData: UserData;
  onSaveProfile: (data: { name: string }) => Promise<ActionResponse | void>;
  onUploadAvatar: (formData: FormData) => Promise<ActionResponse | void>;
  onUpdatePassword: (password: string) => Promise<ActionResponse>;
}

export function EditProfileView({
  initialData,
  onSaveProfile,
  onUploadAvatar,
  onUpdatePassword,
}: EditProfileViewProps) {
  const [activeTab, setActiveTab] = useState("profile");
  const [isFormDirty, setIsFormDirty] = useState(false);

  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [pendingTab, setPendingTab] = useState<string | null>(null);

  const handleTabChange = (nextTab: string) => {
    if (isFormDirty) {
      setPendingTab(nextTab);
      setIsAlertOpen(true);
      return;
    }
    setActiveTab(nextTab);
  };

  const confirmTabChange = () => {
    if (pendingTab) {
      setActiveTab(pendingTab);
      setIsFormDirty(false);
      setPendingTab(null);
    }
    setIsAlertOpen(false);
  };

  const cancelTabChange = () => {
    setPendingTab(null);
    setIsAlertOpen(false);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Tabs
        defaultValue="profile"
        value={activeTab}
        onValueChange={handleTabChange}
        className="w-full overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
      >
        <TabsList
          className="flex w-full group-data-[orientation=horizontal]/tabs:h-12"
          variant="line"
        >
          <TabsTrigger
            value="profile"
            className={`text-[16px] font-medium md:text-[18px] ${
              initialData.role !== "TEACHER"
                ? "data-[state=active]:text-primary after:bg-primary text-slate-400 hover:text-slate-600"
                : "data-[state=active]:text-primary after:bg-primary text-slate-400 hover:text-slate-600"
            }`}
          >
            Perfil
          </TabsTrigger>
          <TabsTrigger
            value="password"
            className="hover:text-primary data-[state=active]:text-primary after:bg-primary text-[16px] font-medium text-slate-400 transition-colors md:text-[18px]"
          >
            Senha
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value="profile"
          className="bg-transparent text-[16px] font-bold text-slate-400 hover:text-slate-600 data-[state=active]:border-yellow-600 data-[state=active]:text-yellow-600 md:text-[18px]"
        >
          <ProfileForm
            initialData={initialData}
            onSave={onSaveProfile}
            onUpload={onUploadAvatar}
            onDirtyStateChange={setIsFormDirty}
          />
        </TabsContent>

        <TabsContent value="password">
          <PasswordForm onUpdate={onUpdatePassword} />
        </TabsContent>
      </Tabs>

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent className="rounded-3xl sm:max-w-[425px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-extrabold">
              Descartar alterações?
            </AlertDialogTitle>
            <AlertDialogDescription className="leading-relaxed font-medium text-slate-500">
              Você tem alterações não salvas no seu perfil. Se mudar de aba agora, todos os dados
              preenchidos serão perdidos. Deseja continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 gap-2 sm:gap-0">
            <AlertDialogCancel
              onClick={cancelTabChange}
              className="mt-0 h-12 rounded-xl border-slate-200 font-bold text-slate-600 hover:bg-slate-50"
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmTabChange}
              className="h-12 rounded-xl bg-red-600 font-bold text-white shadow-lg shadow-red-500/20 hover:bg-red-700"
            >
              Sim, descartar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
