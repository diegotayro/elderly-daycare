"use server";

import { refresh } from "next/cache";
import { cookies } from "next/headers";
import { getCurrentUser } from "@/auth/get-current-user";
import { isUuid } from "@/shared/text/is-uuid";
import { createClient } from "@/shared/supabase/server";
import { MAX_PHOTOS } from "../new-post-limits";
import type { AttachPhotoInput } from "../types";

type AttachPostPhotosResult = { status: "ok" } | { status: "error" };

function isPositiveInteger(value: unknown): value is number {
  return Number.isInteger(value) && (value as number) > 0;
}

// Cada foto debe estar en {postId}/{position}.webp
function isValidPhoto(postId: string, photo: unknown) {
  if (typeof photo !== "object" || photo === null) return false;
  const { path, width, height, position } = photo as Record<string, unknown>;
  return (
    Number.isInteger(position) &&
    (position as number) >= 0 &&
    path === `${postId}/${position}.webp` &&
    isPositiveInteger(width) &&
    isPositiveInteger(height)
  );
}

export async function attachPostPhotos(
  postId: string,
  photos: AttachPhotoInput[],
): Promise<AttachPostPhotosResult> {
  const user = await getCurrentUser();
  if (!user || user.role === "relative") return { status: "error" };

  const hasValidShape =
    typeof postId === "string" &&
    isUuid(postId) &&
    Array.isArray(photos) &&
    photos.length >= 1 &&
    photos.length <= MAX_PHOTOS &&
    photos.every((photo) => isValidPhoto(postId, photo));
  if (!hasValidShape) return { status: "error" };

  const supabase = createClient(await cookies());
  const { error } = await supabase.from("post_photos").insert(
    photos.map((photo) => ({
      post_id: postId,
      url: photo.path,
      width: photo.width,
      height: photo.height,
      position: photo.position,
    })),
  );
  if (error) {
    console.error(
      "attachPostPhotos: no se pudieron registrar las fotos",
      error,
    );
    return { status: "error" };
  }

  refresh();
  return { status: "ok" };
}
