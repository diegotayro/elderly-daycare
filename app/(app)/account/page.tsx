import type { Metadata } from "next";
import { AccountView } from "@/account/components/AccountView";
import { teamNotificationPreferences } from "@/account/notification-preferences";
import { requireTeamUser } from "@/auth/require-user";
import { userRoleLabels } from "@/users/user-role-labels";

export const metadata: Metadata = {
  title: "Mi cuenta · Casa Nogal",
};

export default async function AccountPage() {
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
