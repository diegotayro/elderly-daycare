import { getAvatarTone } from "@/elderly/get-avatar-tone";
import type { CurrentUser } from "@/auth/types";
import { formatRelativeTime } from "@/shared/date/format-relative-time";
import { commentRoleLabels } from "./comment-role-labels";
import type { CommentRow } from "./fetch-comments";
import type { CommentView } from "./types";

const UNKNOWN_AUTHOR_NAME = "Usuario";
const UNKNOWN_AUTHOR_INITIAL = "?";

export function toCommentView(
  row: CommentRow,
  currentUser: Pick<CurrentUser, "id" | "role">,
  today: string,
  photoUrls: Record<string, string>,
): CommentView {
  const authorName = row.author?.full_name ?? UNKNOWN_AUTHOR_NAME;

  return {
    id: row.id,
    authorInitial: row.author
      ? authorName.charAt(0).toUpperCase()
      : UNKNOWN_AUTHOR_INITIAL,
    authorTone: getAvatarTone(row.author_id),
    authorPhotoUrl: photoUrls[row.author_id] ?? null,
    authorName,
    roleLabel: row.author ? commentRoleLabels[row.author.role] : null,
    timeLabel: formatRelativeTime(row.created_at, today),
    body: row.body,
    canDelete: row.author_id === currentUser.id || currentUser.role === "admin",
  };
}
