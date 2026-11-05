import Link from "next/link";
import { CommentIcon } from "@/shared/components/icons/CommentIcon";
import { HeartIcon } from "@/shared/components/icons/HeartIcon";
import { ImageIcon } from "@/shared/components/icons/ImageIcon";
import type { FeedPost } from "../types";
import { PostAuthorAvatar } from "./PostAuthorAvatar";
import { PostTypeBadge } from "./PostTypeBadge";

type PostCardProps = {
  post: FeedPost;
};

export function PostCard({ post }: PostCardProps) {
  const subtitle = post.publishedByMe
    ? `${post.time} · publicado por ti`
    : post.time;

  return (
    <article className="rounded-[20px] border border-line bg-surface px-[22px] py-5 shadow-[0_4px_16px_-12px_rgba(120,90,60,0.5)]">
      <div className="mb-3.5 flex items-center gap-3">
        <PostAuthorAvatar
          avatarInitial={post.avatarInitial}
          type={post.type}
        />
        <div className="flex-1">
          <div className="font-display text-[16.5px] font-semibold text-ink">
            {post.heading}
          </div>
          <div className="text-[12.5px] text-muted">{subtitle}</div>
        </div>
        <PostTypeBadge type={post.type} />
      </div>

      <div className="mb-2.5 text-[12.5px] text-muted">
        Para: {post.recipientLabel}
      </div>
      <p className="m-0 text-[15.5px] leading-[1.55] text-body">{post.body}</p>

      {post.photoCaption && (
        <Link
          href="/"
          className="mt-3.5 flex h-40 lg:h-[200px] flex-col items-center justify-center gap-2 rounded-2xl border-[1.5px] border-dashed border-photo-line bg-photo text-photo-ink"
        >
          <ImageIcon size={30} />
          <span className="text-[13.5px]">{post.photoCaption}</span>
        </Link>
      )}

      <div className="mt-4 flex items-center gap-[18px] border-t border-line-soft pt-3.5">
        <span className="flex items-center gap-[7px] text-sm font-bold text-coral-icon">
          <HeartIcon size={19} />
          {post.reactionCount}
        </span>
        <Link
          href="/"
          className="flex items-center gap-[7px] text-sm font-bold text-muted-strong"
        >
          <CommentIcon size={18} />
          {post.commentCount}
        </Link>
        <span className="flex-1" />
        {post.publishedByMe && (
          <Link href="/" className="text-sm font-extrabold text-coral-link">
            Editar
          </Link>
        )}
      </div>
    </article>
  );
}
