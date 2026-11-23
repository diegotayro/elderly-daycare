"use server";

import { cookies } from "next/headers";
import { getCurrentUser } from "@/auth/get-current-user";
import { createClient } from "@/shared/supabase/server";
import { isUuid } from "@/shared/text/is-uuid";
import { MAX_PHOTOS } from "../new-post-limits";

type RemoveUploadedPhotosResult = { status: "ok" } | { status: "error" };

function isPostPhotoPath(postId: string, path: unknown): path is string {
  return (
    typeof path === "string" && new RegExp(`^${postId}/\\d+\\.webp$`).test(path)
  );
}

// Deshace las subidas de una edición que falló. La RLS de Storage exige poder editar el post.
export async function removeUploadedPhotos(
  postId: string,
  paths: string[],
): Promise<RemoveUploadedPhotosResult> {
  const user = await getCurrentUser();
  if (!user || user.role === "relative") return { status: "error" };

  const hasValidShape =
    typeof postId === "string" &&
    isUuid(postId) &&
    Array.isArray(paths) &&
    paths.length <= MAX_PHOTOS &&
    paths.every((path) => isPostPhotoPath(postId, path));
  if (!hasValidShape) return { status: "error" };
  if (paths.length === 0) return { status: "ok" };

  const supabase = createClient(await cookies());
  const { error } = await supabase.storage.from("post-photos").remove(paths);
  if (error) {
    console.error(
      "removeUploadedPhotos: no se pudieron borrar los archivos",
      error,
    );
    return { status: "error" };
  }
  return { status: "ok" };
}
