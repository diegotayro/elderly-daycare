import { requireRelativeUser } from "@/auth/require-user";
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
      userId={user.id}
      fullName={user.full_name}
      email={user.email}
      photoUrl={photoUrl}
      elderly={elderly}
    />
  );
}
