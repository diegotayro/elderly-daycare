import { getCurrentUser } from "@/auth/get-current-user";
import type { NavVariant } from "./nav-items";
import { MobileBottomNav } from "./MobileBottomNav";

type CurrentUserMobileBottomNavProps = {
  variant: NavVariant;
};

export async function CurrentUserMobileBottomNav({
  variant,
}: CurrentUserMobileBottomNavProps) {
  const user = await getCurrentUser();

  return <MobileBottomNav variant={variant} isAdmin={user?.role === "admin"} />;
}
