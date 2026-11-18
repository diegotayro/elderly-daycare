"use server";

import { cookies } from "next/headers";
import { getCurrentUser } from "@/auth/get-current-user";
import { isUuid } from "@/shared/text/is-uuid";
import { createClient } from "@/shared/supabase/server";

const PHOTOS_BUCKET = "post-photos";

type DiscardPostResult = { status: "ok" } | { status: "error" };

// Deshace una publicación fallida: primero los archivos de {postId}/ y después el post.
// La RLS exige que quien llama sea el autor.
export async function discardPost(postId: string): Promise<DiscardPostResult> {
  const user = await getCurrentUser();
  if (!user || user.role === "relative") return { status: "error" };
  if (typeof postId !== "string" || !isUuid(postId)) return { status: "error" };

  const supabase = createClient(await cookies());
  const storage = supabase.storage.from(PHOTOS_BUCKET);

  const { data: files, error: listError } = await storage.list(postId);
  if (listError) {
    console.error("discardPost: no se pudieron listar los archivos", listError);
    return { status: "error" };
  }

  if (files.length > 0) {
    const { error: removeError } = await storage.remove(
      files.map((file) => `${postId}/${file.name}`),
    );
    if (removeError) {
      console.error(
        "discardPost: no se pudieron borrar los archivos",
        removeError,
      );
      return { status: "error" };
    }
  }

  const { error: deleteError } = await supabase
    .from("posts")
    .delete()
    .eq("id", postId);
  if (deleteError) {
    console.error("discardPost: no se pudo borrar el post", deleteError);
    return { status: "error" };
  }

  return { status: "ok" };
}
