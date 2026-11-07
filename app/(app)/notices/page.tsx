import type { Metadata } from "next";
import { NoticesView } from "@/notices/components/NoticesView";
import { mockNotices } from "@/notices/mock-notices";

export const metadata: Metadata = {
  title: "Avisos · Casa Nogal",
};

export default function NoticesPage() {
  return <NoticesView notices={mockNotices} />;
}
