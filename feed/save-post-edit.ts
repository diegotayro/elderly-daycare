import { getPostForEdit } from "./actions/get-post-for-edit";
import { removeUploadedPhotos } from "./actions/remove-uploaded-photos";
import { updatePost } from "./actions/update-post";
import {
  compressPhotos,
  uploadPostPhotos,
  type UploadResult,
} from "./upload-post-photos";
import type { NewPostInput, PostForEdit, UpdatePostResult } from "./types";

type SavePostEditParams = {
  post: PostForEdit;
  input: NewPostInput;
  files: File[];
  removedPhotoIds: string[];
};

async function discardUploads(postId: string, paths: string[]) {
  if (paths.length === 0) return;
  await removeUploadedPhotos(postId, paths).catch((error) =>
    console.error("savePostEdit: no se pudieron deshacer las subidas", error),
  );
}

// Si la subida falla porque el staff perdió el permiso, se informa como "has-history"
async function resolveUploadFailure(
  postId: string,
  upload: Extract<UploadResult, { status: "failed" }>,
): Promise<UpdatePostResult> {
  console.error("savePostEdit: falló la subida de fotos", upload.error);
  await discardUploads(postId, upload.uploadedPaths);
  const loaded = await getPostForEdit(postId).catch(() => null);
  return { status: loaded?.status === "has-history" ? "has-history" : "error" };
}

// Comprime, sube las fotos nuevas y guarda todo con updatePost (una sola transacción).
// Si algo falla después de subir, borra los archivos recién subidos.
export async function savePostEdit({
  post,
  input,
  files,
  removedPhotoIds,
}: SavePostEditParams): Promise<UpdatePostResult> {
  const compression = await compressPhotos(files);
  if (compression.status === "failed") {
    return { status: "invalid", errors: { photos: compression.message } };
  }

  const upload = await uploadPostPhotos(
    post.id,
    compression.photos,
    post.nextPhotoPosition,
  );
  if (upload.status === "failed") return resolveUploadFailure(post.id, upload);

  const result = await updatePost(post.id, {
    ...input,
    removedPhotoIds,
    newPhotos: upload.uploaded,
  }).catch((): UpdatePostResult => ({ status: "error" })); // fallo de red

  if (result.status !== "ok") {
    await discardUploads(
      post.id,
      upload.uploaded.map((photo) => photo.path),
    );
  }
  return result;
}
