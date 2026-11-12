import type { Metadata } from "next";
import { requireRelativeUser } from "@/auth/require-user";
import { FamilyAccountView } from "@/family/components/FamilyAccountView";

export const metadata: Metadata = {
  title: "Mi cuenta · Casa Nogal",
};

export default async function FamilyAccountPage() {
  const user = await requireRelativeUser();

  return (
    <FamilyAccountView
      fullName={user.full_name}
      email={user.email}
      notificationValues={{
        notify_on_post: user.notify_on_post,
        daily_summary_enabled: user.daily_summary_enabled,
      }}
    />
  );
}
