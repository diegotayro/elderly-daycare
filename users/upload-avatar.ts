import { compressPhoto } from "@/feed/compress-photo";
import { createClient } from "@/shared/supabase/client";
import { setAvatar } from "./actions/set-avatar";
import { AVATARS_BUCKET, buildAvatarPath } from "./avatar-storage";
import type { AvatarUploadResult } from "./types";

// Comprime en el navegador, sube a Storage (pasa por las policies del bucket) y guarda la ruta.
// Si setAvatar falla, ya borró el archivo recién subido.
export async function uploadAvatar(
  userId: string,
  file: File,
): Promise<AvatarUploadResult> {
  let photo;
  try {
    photo = await compressPhoto(file);
  } catch {
    return { status: "unprocessable" };
  }

  try {
    const path = buildAvatarPath(userId);
    const { error } = await createClient()
      .storage.from(AVATARS_BUCKET)
      .upload(path, photo.blob, { contentType: "image/webp" });
    if (error) throw error;

    const result = await setAvatar(userId, path);
    return { status: result.status === "ok" ? "ok" : "error" };
  } catch (error) {
    console.error("uploadAvatar: falló la subida del avatar", error);
    return { status: "error" };
  }
}
