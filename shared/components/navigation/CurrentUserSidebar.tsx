import { getCurrentUser } from "@/auth/get-current-user";
import { userRoleLabels } from "@/users/user-role-labels";
import { Sidebar } from "./Sidebar";

export async function CurrentUserSidebar() {
  const user = await getCurrentUser();
  if (!user) return <Sidebar />;

  return (
    <Sidebar
      daycareName={user.daycareName}
      userName={user.full_name}
      userRoleLabel={userRoleLabels[user.role]}
    />
  );
}
