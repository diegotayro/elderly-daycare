import type { Metadata } from "next";
import { requireTeamUser } from "@/auth/require-user";
import { NoticesView } from "@/notices/components/NoticesView";
import { mockNotices } from "@/notices/mock-notices";

export const metadata: Metadata = {
  title: "Avisos · Casa Nogal",
};

export default async function NoticesPage() {
  await requireTeamUser();

  return <NoticesView notices={mockNotices} />;
}
