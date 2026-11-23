import type { FeedNotice } from "./types";

const feedNotices: FeedNotice[] = ["post-deleted"];

// Cualquier otro valor del parámetro se ignora
export function readFeedNotice(
  notice: string | string[] | undefined,
): FeedNotice | null {
  return feedNotices.find((item) => item === notice) ?? null;
}
