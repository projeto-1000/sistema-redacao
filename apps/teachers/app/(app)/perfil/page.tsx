import { getProfileData } from "@/services/profile";
import { ProfileClientContent } from "./_components/page-client";
import { PageHeader } from "@repo/ui/components/page-header";

export default async function EditProfilePage() {
  const data = await getProfileData();

  if (!data) return null;

  return (
    <div className="min-h-screen p-6 md:px-20">
      <div className="mb-6">
        <PageHeader
          title='Meu perfil'
          subtitle='Acompanhe seu progresso e gerencie suas informações.'
        />
      </div>

      <ProfileClientContent user={data.user} />
    </div>
  );
}