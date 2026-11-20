import type { AvatarTone } from "@/elderly/avatar-tones";
import { PhotoCarousel } from "@/feed/components/PhotoCarousel";
import { PostAuthorAvatar } from "@/feed/components/PostAuthorAvatar";
import { PostTypeBadge } from "@/feed/components/PostTypeBadge";
import { ReactionButton } from "@/feed/components/ReactionButton";
import { CommentIcon } from "@/shared/components/icons/CommentIcon";
import type { FamilyPost } from "../types";

const listFormatter = new Intl.ListFormat("es", { type: "conjunction" });

// "Habitación Roble · Luis y Carmen": cuáles de sus adultos mayores están en la habitación
function buildRoomLine({ roomName, roomElderlyNames }: FamilyPost): string {
  const room = `Habitación ${roomName ?? ""}`.trim();
  return roomElderlyNames.length > 0
    ? `${room} · ${listFormatter.format(roomElderlyNames)}`
    : room;
}

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

      {post.audience === "room" && (
        <div className="mb-2.5 text-[12.5px] text-muted">
          {buildRoomLine(post)}
        </div>
      )}
      <p className="m-0 text-[15.5px] leading-[1.55] text-body">{post.body}</p>

      {post.photos.length > 0 && <PhotoCarousel photos={post.photos} />}

      <div className="mt-4 flex items-center gap-[18px] border-t border-line-soft pt-3.5">
        <ReactionButton
          postId={post.id}
          initialReacted={post.reactedByMe}
          initialCount={post.reactionCount}
        />
        <span className="flex items-center gap-[7px] text-sm leading-[normal] font-bold text-muted-strong">
          <CommentIcon size={18} />
          {post.commentCount}
        </span>
      </div>
    </article>
  );
}
