import { notFound } from "next/navigation";
import { requireTeamUser } from "@/auth/require-user";
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

  const detail = await getTeamPostDetail(id, user);
  if (!detail) notFound();

  const { post, comments } = detail;

  return (
    <PostDetailView
      post={post}
      comments={comments}
      currentUser={user}
      backHref="/"
    >
      <PostDetailHeader
        avatarInitial={post.avatarInitial}
        type={post.type}
        heading={post.heading}
        subtitle={buildTeamPostSubtitle(post)}
      />
      <div className="mb-2.5 text-[12.5px] text-muted">
        Para: {post.recipientLabel}
      </div>
    </PostDetailView>
  );
}
