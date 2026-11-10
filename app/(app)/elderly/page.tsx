import type { Metadata } from "next";
import { Suspense } from "react";
import { ElderlyListContent } from "@/elderly/components/ElderlyListContent";
import { ElderlyListSkeleton } from "@/elderly/components/ElderlyListSkeleton";

export const metadata: Metadata = {
  title: "Adultos mayores · Casa Nogal",
};

export default function ElderlyPage() {
  return (
    <Suspense fallback={<ElderlyListSkeleton />}>
      <ElderlyListContent />
    </Suspense>
  );
}
