import { requireTeamUser } from "@/auth/require-user";
import { userRoleLabels } from "@/users/user-role-labels";
import { teamNotificationPreferences } from "../notification-preferences";
import { AccountView } from "./AccountView";

export async function AccountContent() {
  const user = await requireTeamUser();

  return (
    <AccountView
      fullName={user.full_name}
      email={user.email}
      detail={userRoleLabels[user.role]}
      preferences={teamNotificationPreferences}
      notificationValues={{
        notify_on_post: user.notify_on_post,
        daily_summary_enabled: user.daily_summary_enabled,
      }}
    />
  );
}
