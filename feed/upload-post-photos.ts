import { createClient } from "@/shared/supabase/client";
import { compressPhoto } from "./compress-photo";
import { newPostMessages as messages } from "./new-post-messages";
import type { AttachPhotoInput, CompressedPhoto } from "./types";

const PHOTOS_BUCKET = "post-photos";

export type CompressionResult =
  | { status: "ok"; photos: CompressedPhoto[] }
  | { status: "failed"; message: string };

// Se comprime todo antes de tocar la DB: un error aquí no deja nada que deshacer
export async function compressPhotos(
  files: File[],
): Promise<CompressionResult> {
  const photos: CompressedPhoto[] = [];
  for (const [index, file] of files.entries()) {
    try {
      photos.push(await compressPhoto(file));
    } catch {
      return {
        status: "failed",
        message: messages.photoProcessingFailed(index + 1),
      };
    }
  }
  return { status: "ok", photos };
}

export type UploadResult =
  | { status: "ok"; uploaded: AttachPhotoInput[] }
  | { status: "failed"; uploadedPaths: string[]; error: unknown };

// Sube a {postId}/{position}.webp, con position desde firstPosition.
// allSettled: si una subida falla, las demás terminan antes de deshacer, y se devuelven
// las rutas subidas para que quien llama no deje archivos huérfanos.
export async function uploadPostPhotos(
  postId: string,
  photos: CompressedPhoto[],
  firstPosition = 0,
): Promise<UploadResult> {
  const storage = createClient().storage.from(PHOTOS_BUCKET);

  const results = await Promise.allSettled(
    photos.map(async ({ blob, width, height }, index) => {
      const position = firstPosition + index;
      const path = `${postId}/${position}.webp`;
      const { error } = await storage.upload(path, blob, {
        contentType: "image/webp",
      });
      if (error) throw error;
      return { path, width, height, position };
    }),
  );

  const uploaded: AttachPhotoInput[] = [];
  let failure: { error: unknown } | null = null;
  for (const result of results) {
    if (result.status === "fulfilled") uploaded.push(result.value);
    else failure ??= { error: result.reason };
  }

  if (failure) {
    return {
      status: "failed",
      uploadedPaths: uploaded.map((photo) => photo.path),
      error: failure.error,
    };
  }
  return { status: "ok", uploaded };
}
