import { requireRelativeUser } from "@/auth/require-user";
import { getCurrentUserPhotoUrl } from "@/users/get-current-user-photo-url";
import { FamilyAccountView } from "./FamilyAccountView";

export async function FamilyAccountContent() {
  const user = await requireRelativeUser();
  const photoUrl = await getCurrentUserPhotoUrl();

  return (
    <FamilyAccountView
      userId={user.id}
      fullName={user.full_name}
      email={user.email}
      photoUrl={photoUrl}
      notificationValues={{
        notify_on_post: user.notify_on_post,
        daily_summary_enabled: user.daily_summary_enabled,
      }}
    />
  );
}
