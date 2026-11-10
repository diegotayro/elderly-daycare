import type { Metadata } from "next";
import { requireTeamUser } from "@/auth/require-user";
import { ElderlyListView } from "@/elderly/components/ElderlyListView";
import { getElderlySource } from "@/elderly/get-elderly-source";

export const metadata: Metadata = {
  title: "Adultos mayores · Casa Nogal",
};

export default async function ElderlyPage() {
  const user = await requireTeamUser();

  return (
    <ElderlyListView
      source={await getElderlySource()}
      canAddElderly={user.role === "admin"}
      includeArchived={user.role === "admin"}
    />
  );
}
