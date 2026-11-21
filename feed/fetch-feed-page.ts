import "server-only";
import { cookies } from "next/headers";
import { shiftDay } from "@/shared/date/shift-day";
import { createClient } from "@/shared/supabase/server";
import type { PostAudience, PostType, UserRole } from "@/shared/database/types";
import type { FeedPhoto, FeedPostData } from "./types";

const PHOTOS_BUCKET = "post-photos";
const SIGNED_URL_SECONDS = 3600;
const LIMA_UTC_OFFSET = "-05:00";

export type ServerClient = ReturnType<typeof createClient>;

export type PostRow = {
  id: string;
  type: PostType;
  audience: PostAudience;
  title: string | null;
  body: string;
  published_at: string;
  author_id: string;
  room_id: string | null;
  author: { first_name: string; role: UserRole } | null;
  room: { name: string } | null;
  // elderly es null cuando la RLS no deja leer al adulto mayor etiquetado
  post_elderly: { elderly: { id: string; first_name: string } | null }[];
  post_photos: {
    url: string;
    width: number | null;
    height: number | null;
    position: number;
  }[];
  reactions: { count: number }[];
  comments: { count: number }[];
};

export const POST_COLUMNS = `
  id, type, audience, title, body, published_at, author_id, room_id,
  author:users!author_id(first_name, role),
  room:rooms(name),
  post_elderly(elderly(id, first_name)),
  post_photos(url, width, height, position),
  reactions(count),
  comments(count)
`;

// Inicio del día en Lima como instante ISO con zona horaria
function startOfLimaDay(day: string): string {
  return `${day}T00:00:00${LIMA_UTC_OFFSET}`;
}

export async function signPhotoUrls(
  supabase: ServerClient,
  paths: string[],
): Promise<Map<string, string>> {
  if (paths.length === 0) return new Map();

  const { data, error } = await supabase.storage
    .from(PHOTOS_BUCKET)
    .createSignedUrls(paths, SIGNED_URL_SECONDS);
  if (error) throw error;

  const urlsByPath = new Map<string, string>();
  for (const item of data) {
    if (item.path && item.signedUrl) urlsByPath.set(item.path, item.signedUrl);
  }
  return urlsByPath;
}

function toPhotos(row: PostRow, urlsByPath: Map<string, string>): FeedPhoto[] {
  return [...row.post_photos]
    .sort((a, b) => a.position - b.position)
    .flatMap((photo) => {
      const url = urlsByPath.get(photo.url);
      return url ? [{ url, width: photo.width, height: photo.height }] : [];
    });
}

export async function fetchReactedPostIds(
  supabase: ServerClient,
  currentUserId: string,
  postIds: string[],
): Promise<Set<string>> {
  if (postIds.length === 0) return new Set();

  const { data, error } = await supabase
    .from("reactions")
    .select("post_id")
    .eq("user_id", currentUserId)
    .in("post_id", postIds);
  if (error) throw error;

  return new Set(data.map((reaction) => reaction.post_id));
}

export function toFeedPostData(
  row: PostRow,
  urlsByPath: Map<string, string>,
  reactedPostIds: Set<string>,
): FeedPostData {
  return {
    id: row.id,
    type: row.type,
    audience: row.audience,
    title: row.title,
    body: row.body,
    publishedAt: row.published_at,
    authorId: row.author_id,
    authorFirstName: row.author?.first_name ?? null,
    authorRole: row.author?.role ?? null,
    roomId: row.room_id,
    roomName: row.room?.name ?? null,
    elderly: row.post_elderly.flatMap(({ elderly }) =>
      elderly ? [{ id: elderly.id, firstName: elderly.first_name }] : [],
    ),
    photos: toPhotos(row, urlsByPath),
    reactionCount: row.reactions[0]?.count ?? 0,
    reactedByMe: reactedPostIds.has(row.id),
    commentCount: row.comments[0]?.count ?? 0,
  };
}

// Publicaciones visibles entre el inicio del día `from` y el fin del día `to` (hora de Lima),
// de la más nueva a la más vieja. from y to son "aaaa-mm-dd".
export async function fetchFeedPage(
  range: { from: string; to: string },
  currentUserId: string,
): Promise<FeedPostData[]> {
  const supabase = createClient(await cookies());

  const { data, error } = await supabase
    .from("posts")
    .select(POST_COLUMNS)
    .gte("published_at", startOfLimaDay(range.from))
    .lt("published_at", startOfLimaDay(shiftDay(range.to, 1)))
    .order("published_at", { ascending: false })
    .overrideTypes<PostRow[], { merge: false }>();
  if (error) throw error;

  const photoPaths = data.flatMap((row) =>
    row.post_photos.map((photo) => photo.url),
  );
  const [urlsByPath, reactedPostIds] = await Promise.all([
    signPhotoUrls(supabase, photoPaths),
    fetchReactedPostIds(
      supabase,
      currentUserId,
      data.map((row) => row.id),
    ),
  ]);

  return data.map((row) => toFeedPostData(row, urlsByPath, reactedPostIds));
}
