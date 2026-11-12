import { getCurrentUser } from "@/auth/get-current-user";
import { Sidebar } from "@/shared/components/navigation/Sidebar";
import { userRoleLabels } from "@/users/user-role-labels";

export async function CurrentFamilySidebar() {
  const user = await getCurrentUser();
  if (!user) return <Sidebar variant="family" />;

  return (
    <Sidebar
      variant="family"
      daycareName={user.daycareName}
      userName={user.full_name}
      userRoleLabel={userRoleLabels[user.role]}
    />
  );
}
