import { getProfileData } from "@/app/actions/profile";
import { PageHeader } from "@repo/ui/components/page-header";
import { ProfileHeader } from "@repo/ui/components/profile-header";

export default async function ProfileProfilePage() {
  const data = await getProfileData();

  if (!data) return null;

  return (
    <div className="min-h-dvh px-4 md:px-10 lg:px-12 py-4 space-y-4">

      <PageHeader
        title='Meu perfil'
        subtitle='Acompanhe seu progresso e gerencie suas informações.'
      />

      <ProfileHeader
        user={data.user}
        secondaryAction={{
          label: "Gerenciar pagamentos",
          href: "/checkout/upgrade"
        }} />
    </div>
  );
}