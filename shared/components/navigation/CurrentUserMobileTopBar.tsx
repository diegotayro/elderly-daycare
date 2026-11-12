import { getCurrentUser } from "@/auth/get-current-user";
import type { NavVariant } from "./nav-items";
import { MobileTopBar } from "./MobileTopBar";

type CurrentUserMobileTopBarProps = {
  variant: NavVariant;
};

export async function CurrentUserMobileTopBar({
  variant,
}: CurrentUserMobileTopBarProps) {
  const user = await getCurrentUser();

  return <MobileTopBar variant={variant} daycareName={user?.daycareName} />;
}
