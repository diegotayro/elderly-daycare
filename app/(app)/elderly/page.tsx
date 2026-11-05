import type { Metadata } from "next";
import { ElderlyListView } from "@/elderly/components/ElderlyListView";
import { mockElderly } from "@/elderly/mock-elderly";

export const metadata: Metadata = {
  title: "Adultos mayores · Casa Nogal",
};

export default function ElderlyPage() {
  return <ElderlyListView source={mockElderly} />;
}
