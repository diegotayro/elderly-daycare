import { getCurrentUser } from "@/auth/get-current-user";
import { userRoleLabels } from "@/users/user-role-labels";
import { Sidebar } from "./Sidebar";

export async function CurrentUserSidebar() {
  const user = await getCurrentUser();
  if (!user) return <Sidebar variant="team" />;

  return (
    <Sidebar
      variant="team"
      daycareName={user.daycareName}
      userName={user.full_name}
      userRoleLabel={userRoleLabels[user.role]}
    />
  );
}
