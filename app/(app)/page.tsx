import { Suspense } from "react";
import { FeedContent } from "@/feed/components/FeedContent";
import { FeedSkeleton } from "@/feed/components/FeedSkeleton";

// searchParams es dinámico: se lee dentro de Suspense para que el shell sea estático
export default function Home(props: PageProps<"/">) {
  return (
    <Suspense fallback={<FeedSkeleton />}>
      <FeedContent searchParams={props.searchParams} />
    </Suspense>
  );
}
