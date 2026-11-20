import "server-only";
import { cookies } from "next/headers";
import { createClient } from "@/shared/supabase/server";
import type { UserRole } from "@/shared/database/types";

export type CommentRow = {
  id: string;
  author_id: string;
  body: string;
  created_at: string;
  // null cuando la RLS no deja leer al autor
  author: { full_name: string; role: UserRole } | null;
};

export const COMMENT_COLUMNS =
  "id, author_id, body, created_at, author:users!author_id(full_name, role)";

// Todos los comentarios del post, del más viejo al más nuevo
export async function fetchComments(postId: string): Promise<CommentRow[]> {
  const supabase = createClient(await cookies());

  const { data, error } = await supabase
    .from("comments")
    .select(COMMENT_COLUMNS)
    .eq("post_id", postId)
    .order("created_at")
    .order("id")
    .returns<CommentRow[]>();
  if (error) throw error;

  return data;
}
