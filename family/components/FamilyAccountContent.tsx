import { requireRelativeUser } from "@/auth/require-user";
import { FamilyAccountView } from "./FamilyAccountView";

export async function FamilyAccountContent() {
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
