import { MAX_PHOTOS } from "./new-post-limits";
import { parseNewPostInput } from "./parse-new-post-input";
import { isUuid } from "@/shared/text/is-uuid";
import type { AttachPhotoInput, EditPostInput } from "./types";

function isPositiveInteger(value: unknown): value is number {
  return Number.isInteger(value) && (value as number) > 0;
}

function parseNewPhoto(postId: string, raw: unknown): AttachPhotoInput | null {
  if (typeof raw !== "object" || raw === null) return null;
  const { path, width, height, position } = raw as Record<string, unknown>;
  const isValid =
    Number.isInteger(position) &&
    (position as number) >= 0 &&
    path === `${postId}/${position}.webp` &&
    isPositiveInteger(width) &&
    isPositiveInteger(height);
  return isValid
    ? {
        path: path as string,
        width: width as number,
        height: height as number,
        position: position as number,
      }
    : null;
}

// Las Server Actions reciben datos sin tipar del cliente: se comprueba la forma antes de validar
export function parseEditPostInput(
  postId: string,
  raw: unknown,
): EditPostInput | null {
  const base = parseNewPostInput(raw);
  if (!base) return null;

  const { removedPhotoIds, newPhotos } = raw as Record<string, unknown>;
  if (
    !Array.isArray(removedPhotoIds) ||
    !removedPhotoIds.every((id) => typeof id === "string" && isUuid(id)) ||
    !Array.isArray(newPhotos) ||
    newPhotos.length > MAX_PHOTOS
  ) {
    return null;
  }

  const parsedPhotos = newPhotos.map((photo) => parseNewPhoto(postId, photo));
  if (parsedPhotos.some((photo) => photo === null)) return null;

  return {
    ...base,
    removedPhotoIds,
    newPhotos: parsedPhotos as AttachPhotoInput[],
  };
}
