import type { PostType } from "@/shared/database/types";
import { postTypeStyles } from "../post-type-styles";

type PostTypeBadgeProps = {
  type: PostType;
};

export function PostTypeBadge({ type }: PostTypeBadgeProps) {
  const { label, bg, fg } = postTypeStyles[type];

  return (
    <div
      className="flex items-center gap-[7px] rounded-full px-3 py-1.5"
      style={{ backgroundColor: bg, color: fg }}
    >
      <span
        className="size-2 rounded-full"
        style={{ backgroundColor: fg }}
      />
      <span className="text-xs font-extrabold tracking-[0.5px]">
        {label.toUpperCase()}
      </span>
    </div>
  );
}
