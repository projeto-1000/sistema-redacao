'use client'

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
  avatarUrl?: string
};
interface EditProfileViewProps {
  initialData: UserData;
  onSaveProfile: (data: { name: string }) => Promise<ActionResponse | void>;
  onUploadAvatar: (formData: FormData) => Promise<ActionResponse | void>;
  onUpdatePassword: (password: string) => Promise<ActionResponse>;
}

export function EditProfileView({ initialData, onSaveProfile, onUploadAvatar, onUpdatePassword }: EditProfileViewProps) {
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
    <div className="max-w-4xl mx-auto space-y-6">
      <Tabs
        defaultValue="profile"
        value={activeTab}
        onValueChange={handleTabChange}
        className="w-full bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <TabsList
          className="w-full flex group-data-[orientation=horizontal]/tabs:h-12"
          variant='line'>
          <TabsTrigger value="profile"
            className={`text-[16px] md:text-[18px] font-medium ${initialData.role !== 'TEACHER' ?
              'text-slate-400 hover:text-slate-600 data-[state=active]:text-primary after:bg-primary' :
              'text-slate-400 hover:text-slate-600 data-[state=active]:text-primary after:bg-primary'
              }`}>
            Perfil
          </TabsTrigger>
          <TabsTrigger value="password"
            className={`text-[16px] md:text-[18px] font-medium ${initialData.role !== 'TEACHER' ?
              'text-slate-400 hover:text-slate-600 data-[state=active]:text-primary after:bg-primary' :
              ' hover:bg-secondary/70 after:bg-secondary'
              }`}>
            Senha
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="text-[16px] md:text-[18px] font-bold text-slate-400 hover:text-slate-600 bg-transparent data-[state=active]:text-yellow-600 data-[state=active]:border-yellow-600">
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
            <AlertDialogDescription className="text-slate-500 font-medium leading-relaxed">
              Você tem alterações não salvas no seu perfil. Se mudar de aba agora, todos os dados preenchidos serão perdidos. Deseja continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0 mt-4">
            <AlertDialogCancel
              onClick={cancelTabChange}
              className="h-12 rounded-xl font-bold border-slate-200 text-slate-600 hover:bg-slate-50 mt-0"
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmTabChange}
              className="h-12 rounded-xl font-bold bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/20"
            >
              Sim, descartar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div >
  );
}