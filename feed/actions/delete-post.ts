"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getCurrentUser } from "@/auth/get-current-user";
import { createClient } from "@/shared/supabase/server";
import { isUuid } from "@/shared/text/is-uuid";
import { removePostWithPhotos } from "../remove-post-with-photos";
import type { DeletePostResult } from "../types";

const LOG_LABEL = "deletePost";

async function readHasHistory(
  supabase: SupabaseClient,
  postId: string,
): Promise<boolean | null> {
  const { data, error } = await supabase.rpc("post_has_history", {
    p_post_id: postId,
  });
  if (error) {
    console.error(`${LOG_LABEL}: no se pudo leer el historial`, error);
    return null;
  }
  return data === true;
}

// Admin: cualquier post de su guardería. Staff: solo los suyos sin historial (lo exige también la RLS).
export async function deletePost(postId: string): Promise<DeletePostResult> {
  const user = await getCurrentUser();
  if (!user || user.role === "relative") return { status: "error" };
  if (typeof postId !== "string" || !isUuid(postId)) return { status: "error" };

  const supabase = createClient(await cookies());

  const { data: post, error: readError } = await supabase
    .from("posts")
    .select("author_id")
    .eq("id", postId)
    .maybeSingle<{ author_id: string }>();
  if (readError) {
    console.error(`${LOG_LABEL}: no se pudo leer el post`, readError);
    return { status: "error" };
  }
  if (!post) return { status: "error" };

  const isStaff = user.role === "staff";
  if (isStaff) {
    if (post.author_id !== user.id) return { status: "error" };
    const hasHistory = await readHasHistory(supabase, postId);
    if (hasHistory === null) return { status: "error" };
    if (hasHistory) return { status: "has-history" };
  }

  const result = await removePostWithPhotos(supabase, postId, LOG_LABEL);
  if (result === "error") return { status: "error" };
  if (result === "not-removed") {
    // Historial creado entre la lectura y el borrado: la RLS no deja borrar
    if (isStaff && (await readHasHistory(supabase, postId))) {
      return { status: "has-history" };
    }
    console.error(`${LOG_LABEL}: la RLS no dejó borrar el post`, postId);
    return { status: "error" };
  }

  redirect("/?notice=post-deleted");
}
