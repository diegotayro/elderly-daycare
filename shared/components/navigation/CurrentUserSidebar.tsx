import { getCurrentUser } from "@/auth/get-current-user";
import { getCurrentUserPhotoUrl } from "@/users/get-current-user-photo-url";
import { userRoleLabels } from "@/users/user-role-labels";
import { Sidebar } from "./Sidebar";

export async function CurrentUserSidebar() {
  const user = await getCurrentUser();
  if (!user) return <Sidebar variant="team" />;

  const photoUrl = await getCurrentUserPhotoUrl();

  return (
    <Sidebar
      variant="team"
      daycareName={user.daycareName}
      userName={user.full_name}
      userRoleLabel={userRoleLabels[user.role]}
      userPhotoUrl={photoUrl}
      isAdmin={user.role === "admin"}
    />
  );
}
