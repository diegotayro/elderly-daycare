import { requireRelativeUser } from "@/auth/require-user";
import { FamilyFeedView } from "./FamilyFeedView";

export async function FamilyFeedContent() {
  const user = await requireRelativeUser();

  return <FamilyFeedView firstName={user.first_name} />;
}
