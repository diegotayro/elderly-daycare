import type { Metadata } from "next";
import { requireRelativeUser } from "@/auth/require-user";
import { DailySummaryView } from "@/family/components/DailySummaryView";

export const metadata: Metadata = {
  title: "Resumen del día · Casa Nogal",
};

export default async function FamilySummaryPage() {
  await requireRelativeUser();

  return <DailySummaryView />;
}
