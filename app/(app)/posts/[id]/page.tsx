import type { Metadata } from "next";
import { Suspense } from "react";
import { PostDetailContent } from "@/feed/components/PostDetailContent";
import { PostDetailSkeleton } from "@/feed/components/PostDetailSkeleton";

export const metadata: Metadata = {
  title: "Publicación · Casa Nogal",
};

export default function PostDetailPage(props: PageProps<"/posts/[id]">) {
  return (
    <Suspense fallback={<PostDetailSkeleton />}>
      <PostDetailContent params={props.params} />
    </Suspense>
  );
}
