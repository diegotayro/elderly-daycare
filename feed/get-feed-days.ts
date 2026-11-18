import "server-only";
import { cookies } from "next/headers";
import { getLimaDay } from "@/shared/date/get-lima-today";
import { shiftDay } from "@/shared/date/shift-day";
import { createClient } from "@/shared/supabase/server";
import { fetchFeedPage } from "./fetch-feed-page";
import type { FeedDataDay, FeedDataPage, FeedPostData } from "./types";

const DAYS_PER_PAGE = 2;

async function fetchVisibleDaysBefore(
  before: string,
  limit: number,
): Promise<string[]> {
  const supabase = createClient(await cookies());
  const { data, error } = await supabase.rpc("visible_post_days", {
    p_before: before,
    p_limit: limit,
  });
  if (error) throw error;
  return data as string[];
}

function groupByDay(days: string[], posts: FeedPostData[]): FeedDataDay[] {
  return days.map((date) => ({
    date,
    posts: posts.filter(
      (post) => getLimaDay(new Date(post.publishedAt)) === date,
    ),
  }));
}

// Carga inicial: hoy y ayer (aunque estén vacíos)
export async function getInitialFeedDays(today: string): Promise<FeedDataPage> {
  const yesterday = shiftDay(today, -1);
  const [posts, olderDays] = await Promise.all([
    fetchFeedPage({ from: yesterday, to: today }),
    fetchVisibleDaysBefore(yesterday, 1),
  ]);

  return {
    days: groupByDay([today, yesterday], posts),
    hasMore: olderDays.length > 0,
  };
}

// "Cargar más": los 2 días siguientes con publicaciones anteriores a `before`
export async function getFeedDaysBefore(before: string): Promise<FeedDataPage> {
  // Se pide un día de más para saber si queda algo después de esta página
  const visibleDays = await fetchVisibleDaysBefore(before, DAYS_PER_PAGE + 1);
  const days = visibleDays.slice(0, DAYS_PER_PAGE);
  if (days.length === 0) return { days: [], hasMore: false };

  const posts = await fetchFeedPage({
    from: days[days.length - 1],
    to: days[0],
  });
  return {
    days: groupByDay(days, posts),
    hasMore: visibleDays.length > DAYS_PER_PAGE,
  };
}
