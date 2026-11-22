import { requireRelativeUser } from "@/auth/require-user";
import { OWN_AVATAR_PERMISSIONS } from "@/users/avatar-permissions";
import { getCurrentUserPhotoUrl } from "@/users/get-current-user-photo-url";
import { fetchAccountElderly } from "../fetch-account-elderly";
import { FamilyAccountView } from "./FamilyAccountView";

export async function FamilyAccountContent() {
  const user = await requireRelativeUser();
  const [elderly, photoUrl] = await Promise.all([
    fetchAccountElderly(user.id),
    getCurrentUserPhotoUrl(),
  ]);

  return (
    <FamilyAccountView
      mode="own"
      userId={user.id}
      fullName={user.full_name}
      email={user.email}
      photoUrl={photoUrl}
      elderly={elderly}
      avatarPermissions={OWN_AVATAR_PERMISSIONS}
    />
  );
}
