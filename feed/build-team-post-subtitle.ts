import type { FeedPost } from "./types";

// "14:20 · publicado por ti" | "14:20 · Cuidador/a Diego"
export function buildTeamPostSubtitle({
  time,
  publishedByMe,
  authorLabel,
}: Pick<FeedPost, "time" | "publishedByMe" | "authorLabel">): string {
  return `${time} · ${publishedByMe ? "publicado por ti" : authorLabel}`;
}
