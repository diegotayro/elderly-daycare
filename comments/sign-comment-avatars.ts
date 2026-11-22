import "server-only";
import { signAvatarUrls } from "@/users/sign-avatar-urls";
import type { CommentRow } from "./fetch-comments";

// Urls firmadas de los autores que se pueden leer, por id de autor
export function signCommentAvatars(
  rows: CommentRow[],
): Promise<Record<string, string>> {
  return signAvatarUrls(
    rows.flatMap((row) =>
      row.author
        ? [{ id: row.author_id, avatar_url: row.author.avatar_url }]
        : [],
    ),
  );
}
