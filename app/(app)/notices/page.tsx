import type { Metadata } from "next";
import { Suspense } from "react";
import { NoticesContent } from "@/notices/components/NoticesContent";
import { NoticesSkeleton } from "@/notices/components/NoticesSkeleton";

export const metadata: Metadata = {
  title: "Avisos · Casa Nogal",
};

export default function NoticesPage() {
  return (
    <Suspense fallback={<NoticesSkeleton />}>
      <NoticesContent />
    </Suspense>
  );
}
