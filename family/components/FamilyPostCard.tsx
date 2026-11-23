import Link from "next/link";
import type { AvatarTone } from "@/elderly/avatar-tones";
import { PhotoCarousel } from "@/feed/components/PhotoCarousel";
import { PostAuthorAvatar } from "@/feed/components/PostAuthorAvatar";
import { PostTypeBadge } from "@/feed/components/PostTypeBadge";
import { ReactionButton } from "@/feed/components/ReactionButton";
import { CommentIcon } from "@/shared/components/icons/CommentIcon";
import { buildRoomLine } from "../build-room-line";
import type { FamilyPost } from "../types";

type FamilyPostCardProps = {
  post: FamilyPost;
  author: { initial: string; tone: AvatarTone } | null; // null = anuncio general
};

export function FamilyPostCard({ post, author }: FamilyPostCardProps) {
  return (
    <article className="rounded-[20px] border border-line bg-surface px-[22px] py-5 shadow-[0_4px_16px_-12px_rgba(120,90,60,0.5)]">
      <div className="mb-3.5 flex items-center gap-3">
        <PostAuthorAvatar
          avatarInitial={author?.initial ?? null}
          tone={author?.tone}
          type={post.type}
        />
        <div className="flex-1">
          <div className="font-display text-[16.5px] font-semibold text-ink">
            {post.heading}
          </div>
          <div className="text-[12.5px] text-muted">{post.subtitle}</div>
        </div>
        <PostTypeBadge type={post.type} />
      </div>

      {post.audience === "room" && (
        <div className="mb-2.5 text-[12.5px] text-muted">
          {buildRoomLine(post)}
        </div>
      )}
      <p className="m-0 text-[15.5px] leading-[1.55] text-body">{post.body}</p>

      {post.photos.length > 0 && (
        <PhotoCarousel
          photos={post.photos}
          viewerPost={{
            postId: post.id,
            heading: post.heading,
            subtitle: post.subtitle,
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
          href={`/family/posts/${post.id}`}
          className="flex items-center gap-[7px] text-sm leading-[normal] font-bold text-muted-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral-strong"
        >
          <CommentIcon size={18} />
          {post.commentCount}
        </Link>
      </div>
    </article>
  );
}
