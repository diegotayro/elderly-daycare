import { postTypeStyles } from "@/feed/post-type-styles";
import type {
  DailySummaryRow,
  ListSummaryPostsRow,
  PostType,
} from "@/shared/database/types";
import { formatLimaTime } from "@/shared/date/format-lima-time";
import { formatLongDay } from "@/shared/date/format-long-day";
import type {
  DailySummaryData,
  SummaryHighlight,
  SummaryStatus,
} from "./types";

const HIGHLIGHT_TYPES: PostType[] = ["nap", "activity", "achievement"];

type BuildDailySummaryParams = {
  elderlyId: string;
  firstName: string;
  day: string;
  row: DailySummaryRow | null;
  posts: ListSummaryPostsRow[];
  postHrefPrefix: string; // "/posts" | "/family/posts"
};

function buildStatus(row: DailySummaryRow | null): SummaryStatus {
  if (!row) return { kind: "empty" };
  if (row.sent_at) return { kind: "sent", sentAt: row.sent_at };
  return { kind: "draft" };
}

export function buildDailySummary({
  elderlyId,
  firstName,
  day,
  row,
  posts,
  postHrefPrefix,
}: BuildDailySummaryParams): DailySummaryData {
  const highlights: SummaryHighlight[] = posts
    .filter((post) => HIGHLIGHT_TYPES.includes(post.type))
    .map((post) => ({
      id: post.id,
      type: post.type,
      title: post.title ?? postTypeStyles[post.type].label,
      time: formatLimaTime(post.published_at),
      detail: post.body,
      href: `${postHrefPrefix}/${post.id}`,
    }));

  return {
    elderlyId,
    firstName,
    day,
    dateLabel: formatLongDay(day),
    status: buildStatus(row),
    mealsCount: posts.filter((post) => post.type === "meal").length,
    sleepMinutes: row?.sleep_minutes ?? null,
    momentsCount: highlights.length,
    mood: row?.mood ?? null,
    highlights,
  };
}
