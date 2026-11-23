"use server";

import { getCurrentUser } from "@/auth/get-current-user";
import { loadPostForEdit } from "../load-post-for-edit";
import type { GetPostForEditResult } from "../types";

export async function getPostForEdit(
  postId: string,
): Promise<GetPostForEditResult> {
  const user = await getCurrentUser();
  if (!user) return { status: "error" };

  try {
    const loaded = await loadPostForEdit(postId, user);
    if (loaded.status !== "ok") return loaded;
    return { status: "ok", post: loaded.post, options: loaded.options };
  } catch (error) {
    console.error("getPostForEdit: no se pudo cargar la publicación", error);
    return { status: "error" };
  }
}
