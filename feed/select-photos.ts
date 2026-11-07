import { MAX_PHOTO_BYTES, MAX_PHOTOS } from "./new-post-limits";
import { newPostMessages as messages } from "./new-post-messages";
import type { PhotoSelectionResult } from "./types";

function getPhotoError(file: File): string | null {
  if (!file.type.startsWith("image/")) return messages.photoNotImage;
  if (file.size > MAX_PHOTO_BYTES) return messages.photoTooLarge;
  return null;
}

export function selectPhotos(
  current: File[],
  incoming: File[],
): PhotoSelectionResult {
  const accepted: File[] = [];
  let error: string | null = null;

  for (const file of incoming) {
    const fileError = getPhotoError(file);
    if (fileError) {
      error ??= fileError;
    } else if (current.length + accepted.length >= MAX_PHOTOS) {
      error ??= messages.tooManyPhotos;
    } else {
      accepted.push(file);
    }
  }

  return { accepted, error };
}
