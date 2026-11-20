"use server";

import { getCurrentUser } from "@/auth/get-current-user";
import { getFeedDaysBefore } from "@/feed/get-feed-days";
import type { FeedPage } from "@/feed/types";
import { getLimaToday } from "@/shared/date/get-lima-today";
import { buildFamilyFeed } from "../build-family-feed";
import { fetchFamilyFeedElderly } from "../fetch-family-feed-elderly";
import type { FamilyPost } from "../types";

const DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export async function loadMoreFamilyFeed(
  before: string,
): Promise<FeedPage<FamilyPost>> {
  const user = await getCurrentUser();
  if (user?.role !== "relative") throw new Error("No autorizado");
  if (typeof before !== "string" || !DAY_PATTERN.test(before)) {
    throw new Error("Día inválido");
  }

  const [elderly, page] = await Promise.all([
    fetchFamilyFeedElderly(user.id),
    getFeedDaysBefore(before, user.id),
  ]);
  return buildFamilyFeed(page, { today: getLimaToday(), elderly });
}
