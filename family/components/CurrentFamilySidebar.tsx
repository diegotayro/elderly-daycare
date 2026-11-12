import { getCurrentUser } from "@/auth/get-current-user";
import { Sidebar } from "@/shared/components/navigation/Sidebar";
import { fetchSidebarElderlyLinks } from "../fetch-sidebar-elderly-links";
import { buildSidebarRelationship } from "../relationship-text";

export async function CurrentFamilySidebar() {
  const user = await getCurrentUser();
  if (!user) return <Sidebar variant="family" />;

  const links = await fetchSidebarElderlyLinks(user.id);

  return (
    <Sidebar
      variant="family"
      daycareName={user.daycareName}
      userName={user.full_name}
      userRoleLabel={buildSidebarRelationship(links)}
    />
  );
}
