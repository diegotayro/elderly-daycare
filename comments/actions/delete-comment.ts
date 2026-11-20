"use server";

import { cookies } from "next/headers";
import { getCurrentUser } from "@/auth/get-current-user";
import { createClient } from "@/shared/supabase/server";
import { isUuid } from "@/shared/text/is-uuid";
import type { DeleteCommentResult } from "../types";

// La RLS decide quién puede borrar: el autor, o el admin de la guardería
export async function deleteComment(
  commentId: string,
): Promise<DeleteCommentResult> {
  if (typeof commentId !== "string" || !isUuid(commentId)) return { status: "error" };

  const user = await getCurrentUser();
  if (!user) return { status: "error" };

  const supabase = createClient(await cookies());
  const { data, error } = await supabase
    .from("comments")
    .delete()
    .eq("id", commentId)
    .select("id");

  if (error) {
    console.error("deleteComment: no se pudo borrar el comentario", error);
    return { status: "error" };
  }
  // Cero filas: la RLS no lo permitió o el comentario ya no existía
  if (data.length === 0) return { status: "error" };
  return { status: "ok" };
}
