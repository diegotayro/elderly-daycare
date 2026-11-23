import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

const PHOTOS_BUCKET = "post-photos";

// removed: se borró el post; not-removed: la RLS no dejó borrar ninguna fila
export type RemovePostResult = "removed" | "not-removed" | "error";

// Borra primero los archivos de {postId}/ y después el post (lo demás se va en cascada)
export async function removePostWithPhotos(
  supabase: SupabaseClient,
  postId: string,
  logLabel: string,
): Promise<RemovePostResult> {
  const storage = supabase.storage.from(PHOTOS_BUCKET);

  const { data: files, error: listError } = await storage.list(postId);
  if (listError) {
    console.error(`${logLabel}: no se pudieron listar los archivos`, listError);
    return "error";
  }

  if (files.length > 0) {
    const { error: removeError } = await storage.remove(
      files.map((file) => `${postId}/${file.name}`),
    );
    if (removeError) {
      console.error(
        `${logLabel}: no se pudieron borrar los archivos`,
        removeError,
      );
      return "error";
    }
  }

  const { count, error: deleteError } = await supabase
    .from("posts")
    .delete({ count: "exact" })
    .eq("id", postId);
  if (deleteError) {
    console.error(`${logLabel}: no se pudo borrar el post`, deleteError);
    return "error";
  }

  return count === 0 ? "not-removed" : "removed";
}
