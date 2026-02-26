'use client'

import { useState } from "react";
import { UserCog } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@repo/ui/components/button";
import { ProfileHeader } from "@repo/ui/components/profile-header";
import { EditProfileModal } from "@repo/ui/components/edit-profile-modal";
import { updateProfile } from "@/services/update-profile";
import { UserData } from "@repo/types";

export function ProfileClientContent({ user }: { user: UserData }) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const router = useRouter();

  const handleSave = async (payload: { name?: string; avatarFile?: File }) => {
    const result = await updateProfile(payload);

    if (result.success) {
      setIsEditOpen(false);
      router.refresh();
    } else {
      throw new Error(result.message || "Erro ao atualizar");
    }
  };

  return (
    <>
      <ProfileHeader
        user={user}
        actions={
          <Button
            onClick={() => setIsEditOpen(true)}
            className="rounded-full font-bold h-11 shadow-md shadow-yellow-500/10 w-fit"
          >
            <UserCog className="size-4.5 mr-2" />
            Editar informações
          </Button>
        }
      />

      <EditProfileModal
        isOpen={isEditOpen}
        onClose={setIsEditOpen}
        initialData={user}
        onSave={handleSave}
      />
    </>
  );
}