import type { Metadata } from "next";
import { Suspense } from "react";
import { FamilyFeedSkeleton } from "@/family/components/FamilyFeedSkeleton";
import { FamilyFeedContent } from "@/family/components/FamilyFeedContent";

export const metadata: Metadata = {
  title: "Feed · Casa Nogal",
};

export default function FamilyFeedPage() {
  return (
    <Suspense fallback={<FamilyFeedSkeleton />}>
      <FamilyFeedContent />
    </Suspense>
  );
}
