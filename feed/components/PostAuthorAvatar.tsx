import { Avatar } from "@/shared/components/Avatar";
import { MegaphoneIcon } from "@/shared/components/icons/MegaphoneIcon";
import type { PostType } from "@/shared/database/types";
import { postTypeStyles } from "../post-type-styles";

type PostAuthorAvatarProps = {
  avatarInitial: string | null;
  type: PostType;
};

export function PostAuthorAvatar({
  avatarInitial,
  type,
}: PostAuthorAvatarProps) {
  if (avatarInitial) {
    return (
      <Avatar
        initial={avatarInitial}
        size={44}
        fontSize={17}
        colorClassName="bg-elderly-bg text-elderly-ink"
      />
    );
  }

  const { bg, fg } = postTypeStyles[type];

  return (
    <div
      className="flex size-11 flex-none items-center justify-center rounded-full"
      style={{ backgroundColor: bg, color: fg }}
    >
      <MegaphoneIcon size={20} />
    </div>
  );
}
