"use server";

import { cookies } from "next/headers";
import { getCurrentUser } from "@/auth/get-current-user";
import { getLimaDay } from "@/shared/date/get-lima-today";
import { createClient } from "@/shared/supabase/server";
import { isUuid } from "@/shared/text/is-uuid";
import type { PhotoDownloadResult } from "../types";

const PHOTOS_BUCKET = "post-photos";
const DOWNLOAD_URL_SECONDS = 60;

type PhotoRow = {
  url: string;
  post: { published_at: string } | null;
};

function buildFileName(publishedAt: string, position: number) {
  return `foto-${getLimaDay(new Date(publishedAt))}-${position + 1}.webp`;
}

export async function getPhotoDownloadUrl(
  postId: string,
  position: number,
): Promise<PhotoDownloadResult> {
  const user = await getCurrentUser();
  if (!user) return { status: "error" };

  const hasValidShape =
    typeof postId === "string" &&
    isUuid(postId) &&
    Number.isInteger(position) &&
    position >= 0;
  if (!hasValidShape) return { status: "error" };

  const supabase = createClient(await cookies());

  // La RLS decide si el usuario ve la foto: sin fila no hay descarga
  const { data, error } = await supabase
    .from("post_photos")
    .select("url, post:posts(published_at)")
    .eq("post_id", postId)
    .eq("position", position)
    .maybeSingle()
    .overrideTypes<PhotoRow, { merge: false }>();
  if (error || !data?.post) return { status: "error" };

  const { data: signed, error: signError } = await supabase.storage
    .from(PHOTOS_BUCKET)
    .createSignedUrl(data.url, DOWNLOAD_URL_SECONDS, {
      download: buildFileName(data.post.published_at, position),
    });
  if (signError || !signed) return { status: "error" };

  return { status: "ok", url: signed.signedUrl };
}
