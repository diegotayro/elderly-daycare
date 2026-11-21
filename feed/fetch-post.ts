import "server-only";
import { cookies } from "next/headers";
import { isUuid } from "@/shared/text/is-uuid";
import { createClient } from "@/shared/supabase/server";
import {
  fetchReactedPostIds,
  POST_COLUMNS,
  signPhotoUrls,
  toFeedPostData,
  type PostRow,
} from "./fetch-feed-page";
import type { FeedPostData } from "./types";

// Devuelve null si el id no es válido o si no existe, se borró o la RLS no deja ver el post
export async function fetchPost(
  postId: string,
  currentUserId: string,
): Promise<FeedPostData | null> {
  if (!isUuid(postId)) return null;

  const supabase = createClient(await cookies());

  const { data, error } = await supabase
    .from("posts")
    .select(POST_COLUMNS)
    .eq("id", postId)
    .maybeSingle<PostRow>();
  if (error) throw error;
  if (!data) return null;

  const [urlsByPath, reactedPostIds] = await Promise.all([
    signPhotoUrls(
      supabase,
      data.post_photos.map((photo) => photo.url),
    ),
    fetchReactedPostIds(supabase, currentUserId, [data.id]),
  ]);

  return toFeedPostData(data, urlsByPath, reactedPostIds);
}
