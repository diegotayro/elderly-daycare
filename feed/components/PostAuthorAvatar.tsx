import { avatarTones, type AvatarTone } from "@/elderly/avatar-tones";
import { Avatar } from "@/shared/components/Avatar";
import { MegaphoneIcon } from "@/shared/components/icons/MegaphoneIcon";
import type { PostType } from "@/shared/database/types";
import { postTypeStyles } from "../post-type-styles";

const sizes = {
  default: { size: 44, fontSize: 17, iconSize: 20 },
  large: { size: 48, fontSize: 18, iconSize: 22 }, // detalle de la publicación
};

type PostAuthorAvatarProps = {
  avatarInitial: string | null;
  type: PostType;
  tone?: AvatarTone; // sin tono, el adulto mayor se pinta en azul
  size?: keyof typeof sizes;
};

export function PostAuthorAvatar({
  avatarInitial,
  type,
  tone,
  size = "default",
}: PostAuthorAvatarProps) {
  const { size: pixels, fontSize, iconSize } = sizes[size];

  if (avatarInitial) {
    return (
      <Avatar
        initial={avatarInitial}
        size={pixels}
        fontSize={fontSize}
        colorClassName="bg-elderly-bg text-elderly-ink"
        colors={tone && avatarTones[tone]}
      />
    );
  }

  const { bg, fg } = postTypeStyles[type];

  return (
    <div
      className="flex flex-none items-center justify-center rounded-full"
      style={{ width: pixels, height: pixels, backgroundColor: bg, color: fg }}
    >
      <MegaphoneIcon size={iconSize} />
    </div>
  );
}
