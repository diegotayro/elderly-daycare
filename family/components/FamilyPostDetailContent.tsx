import { notFound } from "next/navigation";
import { requireRelativeUser } from "@/auth/require-user";
import { PostDetailHeader } from "@/feed/components/PostDetailHeader";
import { PostDetailView } from "@/feed/components/PostDetailView";
import { getFamilyPostDetail } from "@/feed/get-post-detail";
import { buildRoomLine } from "../build-room-line";
import { fetchFamilyFeedElderly } from "../fetch-family-feed-elderly";
import { findPostAuthor } from "../find-post-author";

type FamilyPostDetailContentProps = {
  params: Promise<{ id: string }>;
};

export async function FamilyPostDetailContent({
  params,
}: FamilyPostDetailContentProps) {
  const user = await requireRelativeUser();
  const { id } = await params;

  const elderly = await fetchFamilyFeedElderly(user.id);
  const detail = await getFamilyPostDetail(id, user, elderly);
  if (!detail) notFound();

  const { post, comments } = detail;
  const author = findPostAuthor(post, elderly);

  return (
    <PostDetailView
      post={post}
      comments={comments}
      currentUser={user}
      backHref="/family"
    >
      <PostDetailHeader
        avatarInitial={author?.initial ?? null}
        avatarTone={author?.tone}
        type={post.type}
        heading={post.heading}
        subtitle={`${post.time} · ${post.authorLabel}`}
      />
      {post.audience === "room" && (
        <div className="mb-2.5 text-[12.5px] text-muted">
          {buildRoomLine(post)}
        </div>
      )}
    </PostDetailView>
  );
}
