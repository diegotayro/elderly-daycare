"use server";

import { cookies } from "next/headers";
import { getCurrentUser } from "@/auth/get-current-user";
import { isUuid } from "@/shared/text/is-uuid";
import { createClient } from "@/shared/supabase/server";
import { removePostWithPhotos } from "../remove-post-with-photos";

type DiscardPostResult = { status: "ok" } | { status: "error" };

// Deshace una publicación fallida. La RLS exige que quien llama sea el autor.
export async function discardPost(postId: string): Promise<DiscardPostResult> {
  const user = await getCurrentUser();
  if (!user || user.role === "relative") return { status: "error" };
  if (typeof postId !== "string" || !isUuid(postId)) return { status: "error" };

  const supabase = createClient(await cookies());
  const result = await removePostWithPhotos(supabase, postId, "discardPost");

  return result === "error" ? { status: "error" } : { status: "ok" };
}
