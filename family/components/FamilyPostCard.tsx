import type { AvatarTone } from "@/elderly/avatar-tones";
import { PostAuthorAvatar } from "@/feed/components/PostAuthorAvatar";
import { PostTypeBadge } from "@/feed/components/PostTypeBadge";
import { CommentIcon } from "@/shared/components/icons/CommentIcon";
import { HeartIcon } from "@/shared/components/icons/HeartIcon";
import { ImageIcon } from "@/shared/components/icons/ImageIcon";
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
          <div className="text-[12.5px] text-muted">
            {post.time} · {post.authorLabel}
          </div>
        </div>
        <PostTypeBadge type={post.type} />
      </div>

      <p className="m-0 text-[15.5px] leading-[1.55] text-body">{post.body}</p>

      {post.photoCaption && (
        <div className="mt-3.5 flex h-40 flex-col items-center justify-center gap-2 rounded-2xl border-[1.5px] border-dashed border-photo-line bg-photo text-photo-ink lg:h-[200px]">
          <ImageIcon size={30} />
          <span className="text-[13.5px]">{post.photoCaption}</span>
        </div>
      )}

      <div className="mt-4 flex items-center gap-[18px] border-t border-line-soft pt-3.5">
        <span className="flex items-center gap-[7px] text-sm leading-[normal] font-bold text-coral-icon">
          <HeartIcon size={19} />
          {post.reactionCount}
        </span>
        <span className="flex items-center gap-[7px] text-sm leading-[normal] font-bold text-muted-strong">
          <CommentIcon size={18} />
          {post.commentCount}
        </span>
      </div>
    </article>
  );
}
