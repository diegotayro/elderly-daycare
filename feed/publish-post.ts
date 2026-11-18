import { createClient } from "@/shared/supabase/client";
import { attachPostPhotos } from "./actions/attach-post-photos";
import { createPost } from "./actions/create-post";
import { discardPost } from "./actions/discard-post";
import { compressPhoto } from "./compress-photo";
import { newPostMessages as messages } from "./new-post-messages";
import type {
  AttachPhotoInput,
  CompressedPhoto,
  CreatePostResult,
  NewPostInput,
} from "./types";

const PHOTOS_BUCKET = "post-photos";

type CompressionResult =
  | { status: "ok"; photos: CompressedPhoto[] }
  | { status: "failed"; message: string };

// Se comprime todo antes de crear el post: un error aquí no deja nada que deshacer
async function compressPhotos(files: File[]): Promise<CompressionResult> {
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

async function uploadPhotos(
  postId: string,
  photos: CompressedPhoto[],
): Promise<AttachPhotoInput[]> {
  const storage = createClient().storage.from(PHOTOS_BUCKET);

  // allSettled: si una subida falla, las demás terminan antes de deshacer, para que
  // discardPost no deje archivos huérfanos
  const results = await Promise.allSettled(
    photos.map(async ({ blob, width, height }, position) => {
      const path = `${postId}/${position}.webp`;
      const { error } = await storage.upload(path, blob, {
        contentType: "image/webp",
      });
      if (error) throw error;
      return { path, width, height };
    }),
  );

  const uploaded: AttachPhotoInput[] = [];
  for (const result of results) {
    if (result.status === "rejected") throw result.reason;
    uploaded.push(result.value);
  }
  return uploaded;
}

async function attachPhotos(
  postId: string,
  photos: CompressedPhoto[],
): Promise<boolean> {
  try {
    const uploaded = await uploadPhotos(postId, photos);
    const result = await attachPostPhotos(postId, uploaded);
    return result.status === "ok";
  } catch (error) {
    console.error("publishPost: falló la subida de fotos", error);
    return false;
  }
}

// Comprime, crea el post, sube las fotos y las registra. Si algo falla después de crear
// el post, lo deshace por completo (archivos y fila).
export async function publishPost(
  input: NewPostInput,
  files: File[],
): Promise<CreatePostResult> {
  const compression = await compressPhotos(files);
  if (compression.status === "failed") {
    return { status: "invalid", errors: { photos: compression.message } };
  }

  const created = await createPost(input);
  if (created.status !== "ok" || files.length === 0) return created;

  const attached = await attachPhotos(created.postId, compression.photos);
  if (attached) return created;

  await discardPost(created.postId).catch((error) =>
    console.error("publishPost: no se pudo deshacer la publicación", error),
  );
  return { status: "error" };
}
