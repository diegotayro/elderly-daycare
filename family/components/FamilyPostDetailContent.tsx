import { notFound } from "next/navigation";
import { requireRelativeUser } from "@/auth/require-user";
import { PostDetailHeader } from "@/feed/components/PostDetailHeader";
import { PostDetailView } from "@/feed/components/PostDetailView";
import { getFamilyPostDetail } from "@/feed/get-post-detail";
import { getCurrentUserPhotoUrl } from "@/users/get-current-user-photo-url";
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
  const [detail, photoUrl] = await Promise.all([
    getFamilyPostDetail(id, user, elderly),
    getCurrentUserPhotoUrl(),
  ]);
  if (!detail) notFound();

  const { post, comments } = detail;
  const author = findPostAuthor(post, elderly);
  const subtitle = `${post.time} · ${post.authorLabel}`;

  return (
    <PostDetailView
      post={post}
      viewerPost={{
        postId: post.id,
        heading: post.heading,
        subtitle,
        caption: post.body,
      }}
      comments={comments}
      currentUser={user}
      currentUserPhotoUrl={photoUrl}
      backHref="/family"
    >
      <PostDetailHeader
        avatarInitial={author?.initial ?? null}
        avatarTone={author?.tone}
        type={post.type}
        heading={post.heading}
        subtitle={subtitle}
      />
      {post.audience === "room" && (
        <div className="mb-2.5 text-[12.5px] text-muted">
          {buildRoomLine(post)}
        </div>
      )}
    </PostDetailView>
  );
}
