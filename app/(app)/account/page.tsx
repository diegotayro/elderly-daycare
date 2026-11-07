import type { Metadata } from "next";
import { AccountView } from "@/account/components/AccountView";
import { mockSession } from "@/shared/session/mock-session";
import { userRoleLabels } from "@/users/user-role-labels";

export const metadata: Metadata = {
  title: "Mi cuenta · Casa Nogal",
};

export default function AccountPage() {
  const { currentUser, email } = mockSession;

  return (
    <AccountView
      fullName={currentUser.full_name}
      email={email}
      roleLabel={userRoleLabels[currentUser.role]}
      notificationValues={{
        notify_on_post: currentUser.notify_on_post,
        daily_summary_enabled: currentUser.daily_summary_enabled,
      }}
    />
  );
}
