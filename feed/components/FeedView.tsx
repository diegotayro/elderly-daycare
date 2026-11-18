"use client";

import { useState } from "react";
import { loadMoreTeamFeed } from "../actions/load-more-team-feed";
import type { FeedDay, FeedPage, FeedPost } from "../types";
import { FeedDaySection } from "./FeedDaySection";
import { FeedHeader } from "./FeedHeader";
import { LoadMoreButton } from "./LoadMoreButton";
import { PostComposerButton } from "./PostComposerButton";

type FeedViewProps = {
  daycareName: string;
  userFirstName: string;
  elderlyCount: number;
  todayLabel: string;
  initialPage: FeedPage<FeedPost>;
};

export function FeedView({
  daycareName,
  userFirstName,
  elderlyCount,
  todayLabel,
  initialPage,
}: FeedViewProps) {
  // Las páginas cargadas con "Cargar más" se guardan aparte: al refrescar (por ejemplo, tras
  // publicar) el servidor reenvía hoy y ayer, y los días anteriores ya cargados se conservan
  const [olderPages, setOlderPages] = useState<FeedPage<FeedPost>[]>([]);
  const days: FeedDay<FeedPost>[] = [
    ...initialPage.days,
    ...olderPages.flatMap((page) => page.days),
  ];
  const lastOlderPage = olderPages.at(-1);
  const hasMore = lastOlderPage ? lastOlderPage.hasMore : initialPage.hasMore;

  async function loadMore(): Promise<boolean> {
    const oldestDay = days[days.length - 1].date;
    const page = await loadMoreTeamFeed(oldestDay);
    setOlderPages((current) => [...current, page]);
    return true;
  }

  return (
    <div className="mx-auto w-full max-w-[760px] px-4 pt-5 pb-8 lg:px-10 lg:pt-[34px] lg:pb-20">
      <FeedHeader
        daycareName={daycareName}
        userFirstName={userFirstName}
        elderlyCount={elderlyCount}
        todayLabel={todayLabel}
      />
      <PostComposerButton userInitial={userFirstName[0]} />
      {days.map((day) => (
        <FeedDaySection key={day.date} day={day} />
      ))}
      {hasMore && <LoadMoreButton onLoad={loadMore} />}
    </div>
  );
}
