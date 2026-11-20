"use server";

import { getCurrentUser } from "@/auth/get-current-user";
import { getLimaToday } from "@/shared/date/get-lima-today";
import { buildFeed } from "../build-feed";
import { getFeedDaysBefore } from "../get-feed-days";
import type { FeedPage, FeedPost } from "../types";

const DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export async function loadMoreTeamFeed(
  before: string,
): Promise<FeedPage<FeedPost>> {
  const user = await getCurrentUser();
  if (!user || user.role === "relative") throw new Error("No autorizado");
  if (typeof before !== "string" || !DAY_PATTERN.test(before)) {
    throw new Error("Día inválido");
  }

  const page = await getFeedDaysBefore(before, user.id);
  return buildFeed(page, { currentUserId: user.id, today: getLimaToday() });
}
