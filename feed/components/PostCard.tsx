import Link from "next/link";
import { CommentIcon } from "@/shared/components/icons/CommentIcon";
import { buildTeamPostSubtitle } from "../build-team-post-subtitle";
import type { FeedPost } from "../types";
import { EditPostButton } from "./EditPostButton";
import { PhotoCarousel } from "./PhotoCarousel";
import { PostAuthorAvatar } from "./PostAuthorAvatar";
import { PostTypeBadge } from "./PostTypeBadge";
import { ReactionButton } from "./ReactionButton";

type PostCardProps = {
  post: FeedPost;
};

export function PostCard({ post }: PostCardProps) {
  return (
    <article className="rounded-[20px] border border-line bg-surface px-[22px] py-5 shadow-[0_4px_16px_-12px_rgba(120,90,60,0.5)]">
      <div className="mb-3.5 flex items-center gap-3">
        <PostAuthorAvatar avatarInitial={post.avatarInitial} type={post.type} />
        <div className="flex-1">
          <div className="font-display text-[16.5px] font-semibold text-ink">
            {post.heading}
          </div>
          <div className="text-[12.5px] text-muted">
            {buildTeamPostSubtitle(post)}
          </div>
        </div>
        <PostTypeBadge type={post.type} />
      </div>

      <div className="mb-2.5 text-[12.5px] text-muted">
        Para: {post.recipientLabel}
      </div>
      <p className="m-0 text-[15.5px] leading-[1.55] text-body">{post.body}</p>

      {post.photos.length > 0 && (
        <PhotoCarousel
          photos={post.photos}
          viewerPost={{
            postId: post.id,
            heading: post.heading,
            subtitle: buildTeamPostSubtitle(post),
            caption: post.body,
          }}
        />
      )}

      <div className="mt-4 flex items-center gap-[18px] border-t border-line-soft pt-3.5">
        <ReactionButton
          postId={post.id}
          initialReacted={post.reactedByMe}
          initialCount={post.reactionCount}
        />
        <Link
          href={`/posts/${post.id}`}
          className="flex items-center gap-[7px] text-sm font-bold text-muted-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral-strong"
        >
          <CommentIcon size={18} />
          {post.commentCount}
        </Link>
        <span className="flex-1" />
        {post.canEdit && <EditPostButton postId={post.id} />}
      </div>
    </article>
  );
}
