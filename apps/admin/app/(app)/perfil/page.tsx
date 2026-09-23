import { getProfileData } from "@/app/actions/profile";
import { PageHeader } from "@repo/ui/components/page-header";
import { ProfileHeader } from "@repo/ui/components/profile-header";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Meu perfil",
};

export default async function ProfilePage() {
  const data = await getProfileData();

  if (!data) {
    redirect("/login");
  }

  return (
    <div className="min-h-dvh space-y-4 px-4 py-4 md:px-10 lg:px-12">
      <PageHeader
        title="Meu perfil"
        subtitle="Gerencie suas informações e a segurança da sua conta."
      />

      <ProfileHeader user={data.user} />
    </div>
  );
}
