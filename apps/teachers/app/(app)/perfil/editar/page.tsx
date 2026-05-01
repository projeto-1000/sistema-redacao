import { getProfileData, updateProfile, uploadAvatar, updatePassword } from "@/app/actions/profile";
import { EditProfileView } from "@repo/ui/components/features/profiles/profile-view";

export default async function EditProfilePage() {
  const data = await getProfileData();

  if (!data) return null;

  return (
    <div className="min-h-dvh px-4 md:px-10 lg:px-12 py-4">
      <EditProfileView
        initialData={data.user}
        onSaveProfile={updateProfile}
        onUploadAvatar={uploadAvatar}
        onUpdatePassword={updatePassword}
      />
    </div>
  );
}