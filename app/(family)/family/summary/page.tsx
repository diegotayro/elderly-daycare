import type { Metadata } from "next";
import { Suspense } from "react";
import { DailySummarySkeleton } from "@/family/components/DailySummarySkeleton";
import { DailySummaryContent } from "@/family/components/DailySummaryContent";

export const metadata: Metadata = {
  title: "Resumen del día · Casa Nogal",
};

export default function FamilySummaryPage() {
  return (
    <Suspense fallback={<DailySummarySkeleton />}>
      <DailySummaryContent />
    </Suspense>
  );
}
