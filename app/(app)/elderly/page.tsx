import type { Metadata } from "next";
import { requireTeamUser } from "@/auth/require-user";
import { ElderlyListView } from "@/elderly/components/ElderlyListView";
import { mockElderly } from "@/elderly/mock-elderly";

export const metadata: Metadata = {
  title: "Adultos mayores · Casa Nogal",
};

export default async function ElderlyPage() {
  await requireTeamUser();

  return <ElderlyListView source={mockElderly} />;
}
