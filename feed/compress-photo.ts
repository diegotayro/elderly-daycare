import imageCompression from "browser-image-compression";
import { MAX_PHOTO_SIDE, MAX_UPLOAD_BYTES } from "./new-post-limits";
import type { CompressedPhoto } from "./types";

const BYTES_PER_MB = 1024 * 1024;

async function readDimensions(
  blob: Blob,
): Promise<{ width: number; height: number }> {
  const bitmap = await createImageBitmap(blob);
  const { width, height } = bitmap;
  bitmap.close();
  return { width, height };
}

// Lanza un error si la imagen no se puede leer o sigue pesando más del límite del bucket
export async function compressPhoto(file: File): Promise<CompressedPhoto> {
  const blob = await imageCompression(file, {
    maxSizeMB: MAX_UPLOAD_BYTES / BYTES_PER_MB,
    maxWidthOrHeight: MAX_PHOTO_SIDE,
    fileType: "image/webp",
    useWebWorker: true,
  });
  if (blob.size > MAX_UPLOAD_BYTES) {
    throw new Error("La foto comprimida supera el límite de subida");
  }

  return { blob, ...(await readDimensions(blob)) };
}
