import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AccountView } from "@/account/components/AccountView";
import { getCurrentUser } from "@/auth/get-current-user";
import { userRoleLabels } from "@/users/user-role-labels";

export const metadata: Metadata = {
  title: "Mi cuenta · Casa Nogal",
};

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <AccountView
      fullName={user.full_name}
      email={user.email}
      roleLabel={userRoleLabels[user.role]}
      notificationValues={{
        notify_on_post: user.notify_on_post,
        daily_summary_enabled: user.daily_summary_enabled,
      }}
    />
  );
}
