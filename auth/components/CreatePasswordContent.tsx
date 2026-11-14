import { requirePendingStaff } from "@/auth/require-user";
import { CreatePasswordView } from "./CreatePasswordView";

export async function CreatePasswordContent() {
  const { firstName, email } = await requirePendingStaff();

  return <CreatePasswordView firstName={firstName} email={email} />;
}
