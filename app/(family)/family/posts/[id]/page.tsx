import type { Metadata } from "next";
import { Suspense } from "react";
import { FamilyPostDetailContent } from "@/family/components/FamilyPostDetailContent";
import { PostDetailSkeleton } from "@/feed/components/PostDetailSkeleton";

export const metadata: Metadata = {
  title: "Publicación · Casa Nogal",
};

export default function FamilyPostDetailPage(
  props: PageProps<"/family/posts/[id]">,
) {
  return (
    <Suspense fallback={<PostDetailSkeleton />}>
      <FamilyPostDetailContent params={props.params} />
    </Suspense>
  );
}
