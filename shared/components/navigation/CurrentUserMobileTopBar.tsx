import { getCurrentUser } from "@/auth/get-current-user";
import { MobileTopBar } from "./MobileTopBar";

export async function CurrentUserMobileTopBar() {
  const user = await getCurrentUser();

  return <MobileTopBar daycareName={user?.daycareName} />;
}
