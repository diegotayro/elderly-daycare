import "server-only";
import { cookies } from "next/headers";
import type { CurrentUser } from "@/auth/types";
import { createClient } from "@/shared/supabase/server";
import type { FeedDataPage } from "./types";

// Admin: todas. Staff: las suyas sin historial (una sola consulta por página).
export async function getEditablePostIds(
  page: FeedDataPage,
  user: CurrentUser,
): Promise<Set<string>> {
  const posts = page.days.flatMap((day) => day.posts);
  if (user.role === "admin") return new Set(posts.map((post) => post.id));

  const ownIds = posts
    .filter((post) => post.authorId === user.id)
    .map((post) => post.id);
  if (ownIds.length === 0) return new Set();

  const supabase = createClient(await cookies());
  const { data, error } = await supabase.rpc("posts_with_history", {
    p_post_ids: ownIds,
  });
  if (error) throw error;

  const withHistory = new Set(data as string[]);
  return new Set(ownIds.filter((id) => !withHistory.has(id)));
}
