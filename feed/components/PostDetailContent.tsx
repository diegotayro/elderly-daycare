import { notFound } from "next/navigation";
import { requireTeamUser } from "@/auth/require-user";
import { getCurrentUserPhotoUrl } from "@/users/get-current-user-photo-url";
import { buildTeamPostSubtitle } from "../build-team-post-subtitle";
import { getTeamPostDetail } from "../get-post-detail";
import { PostDetailHeader } from "./PostDetailHeader";
import { PostDetailView } from "./PostDetailView";

type PostDetailContentProps = {
  params: Promise<{ id: string }>;
};

export async function PostDetailContent({ params }: PostDetailContentProps) {
  const user = await requireTeamUser();
  const { id } = await params;

  const [detail, photoUrl] = await Promise.all([
    getTeamPostDetail(id, user),
    getCurrentUserPhotoUrl(),
  ]);
  if (!detail) notFound();

  const { post, comments } = detail;
  const subtitle = buildTeamPostSubtitle(post);

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
      backHref="/"
    >
      <PostDetailHeader
        avatarInitial={post.avatarInitial}
        type={post.type}
        heading={post.heading}
        subtitle={subtitle}
      />
      <div className="mb-2.5 text-[12.5px] text-muted">
        Para: {post.recipientLabel}
      </div>
    </PostDetailView>
  );
}
