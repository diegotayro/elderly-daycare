import { Suspense } from "react";
import { FeedContent } from "@/feed/components/FeedContent";
import { FeedSkeleton } from "@/feed/components/FeedSkeleton";

export default function Home() {
  return (
    <Suspense fallback={<FeedSkeleton />}>
      <FeedContent />
    </Suspense>
  );
}
