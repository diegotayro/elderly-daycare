import { attachPostPhotos } from "./actions/attach-post-photos";
import { createPost } from "./actions/create-post";
import { discardPost } from "./actions/discard-post";
import { compressPhotos, uploadPostPhotos } from "./upload-post-photos";
import type { CompressedPhoto, CreatePostResult, NewPostInput } from "./types";

async function attachPhotos(
  postId: string,
  photos: CompressedPhoto[],
): Promise<boolean> {
  try {
    const upload = await uploadPostPhotos(postId, photos);
    if (upload.status === "failed") throw upload.error;
    const result = await attachPostPhotos(postId, upload.uploaded);
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
