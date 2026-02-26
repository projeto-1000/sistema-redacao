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
        {/* <h2 className="text-3xl font-extrabold tracking-tight mb-2">
          Meu perfil
        </h2>
        <p className="text-[#8B8265]">
          Acompanhe seu progresso e gerencie suas informações.
        </p> */}
      </div>

      <ProfileClientContent user={data.user} />
    </div>
  );
}