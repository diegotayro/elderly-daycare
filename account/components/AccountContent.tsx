import { requireTeamUser } from "@/auth/require-user";
import { getCurrentUserPhotoUrl } from "@/users/get-current-user-photo-url";
import { userRoleLabels } from "@/users/user-role-labels";
import { teamNotificationPreferences } from "../notification-preferences";
import { AccountView } from "./AccountView";

export async function AccountContent() {
  const user = await requireTeamUser();
  const photoUrl = await getCurrentUserPhotoUrl();

  return (
    <AccountView
      userId={user.id}
      fullName={user.full_name}
      email={user.email}
      detail={userRoleLabels[user.role]}
      roleLabel={userRoleLabels[user.role]}
      canEdit={user.role === "admin"}
      photoUrl={photoUrl}
      preferences={teamNotificationPreferences}
      notificationValues={{
        notify_on_post: user.notify_on_post,
        daily_summary_enabled: user.daily_summary_enabled,
      }}
    />
  );
}
