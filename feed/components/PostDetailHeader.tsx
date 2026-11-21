import type { AvatarTone } from "@/elderly/avatar-tones";
import type { PostType } from "@/shared/database/types";
import { PostAuthorAvatar } from "./PostAuthorAvatar";
import { PostTypeBadge } from "./PostTypeBadge";

type PostDetailHeaderProps = {
  avatarInitial: string | null;
  avatarTone?: AvatarTone;
  type: PostType;
  heading: string;
  subtitle: string; // "09:40 · publicado por ti"
};

export function PostDetailHeader({
  avatarInitial,
  avatarTone,
  type,
  heading,
  subtitle,
}: PostDetailHeaderProps) {
  return (
    <div className="mb-4 flex items-center gap-[13px]">
      <PostAuthorAvatar
        avatarInitial={avatarInitial}
        tone={avatarTone}
        type={type}
        size="large"
      />
      <div className="min-w-0 flex-1">
        <div className="font-display text-[17px] font-semibold text-ink">
          {heading}
        </div>
        <div className="text-[13px] text-muted">{subtitle}</div>
      </div>
      <PostTypeBadge type={type} />
    </div>
  );
}
