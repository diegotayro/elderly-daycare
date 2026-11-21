"use server";

import { cookies } from "next/headers";
import { getCurrentUser } from "@/auth/get-current-user";
import { getLimaToday } from "@/shared/date/get-lima-today";
import { createClient } from "@/shared/supabase/server";
import { isUuid } from "@/shared/text/is-uuid";
import { toCommentView } from "../build-comment-view";
import { COMMENT_COLUMNS, type CommentRow } from "../fetch-comments";
import type { CreateCommentResult } from "../types";
import { validateCommentBody } from "../validate-comment-body";

// author_id lo fija siempre el servidor; la RLS decide si el usuario ve el post
export async function createComment(
  postId: string,
  body: string,
): Promise<CreateCommentResult> {
  const isValidInput = typeof postId === "string" && isUuid(postId) && typeof body === "string";
  if (!isValidInput) return { status: "error" };

  const user = await getCurrentUser();
  if (!user) return { status: "error" };

  const validation = validateCommentBody(body);
  if (!validation.valid) return { status: "invalid", error: validation.error };

  const supabase = createClient(await cookies());
  const { data, error } = await supabase
    .from("comments")
    .insert({ post_id: postId, author_id: user.id, body: validation.body })
    .select(COMMENT_COLUMNS)
    .single()
    .overrideTypes<CommentRow, { merge: false }>();

  if (error) {
    console.error("createComment: no se pudo crear el comentario", error);
    return { status: "error" };
  }
  return { status: "ok", comment: toCommentView(data, user, getLimaToday()) };
}
