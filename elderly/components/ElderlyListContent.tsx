import { requireTeamUser } from "@/auth/require-user";
import { getElderlySource } from "../get-elderly-source";
import { ElderlyListView } from "./ElderlyListView";

export async function ElderlyListContent() {
  const user = await requireTeamUser();
  const isAdmin = user.role === "admin";

  return (
    <ElderlyListView
      source={await getElderlySource()}
      canAddElderly={isAdmin}
      includeArchived={isAdmin}
    />
  );
}
