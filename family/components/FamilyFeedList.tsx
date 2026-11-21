"use client";

import { useState } from "react";
import { LoadMoreButton } from "@/feed/components/LoadMoreButton";
import type { FeedDay, FeedPage } from "@/feed/types";
import { loadMoreFamilyFeed } from "../actions/load-more-family-feed";
import { filterFamilyPosts } from "../filter-family-posts";
import { findPostAuthor } from "../find-post-author";
import type { ElderlyFilter, FamilyFeedElderly, FamilyPost } from "../types";
import { ElderlyFilterChips } from "./ElderlyFilterChips";
import { FamilyPostCard } from "./FamilyPostCard";

type FamilyFeedListProps = {
  elderly: FamilyFeedElderly[];
  initialPage: FeedPage<FamilyPost>;
};

type DaySectionProps = {
  day: FeedDay<FamilyPost>;
  elderly: FamilyFeedElderly[];
};

function FamilyDaySection({ day, elderly }: DaySectionProps) {
  return (
    <section className="mb-7">
      <div className="mb-3.5 flex items-center gap-3.5">
        <span className="text-[12.5px] font-extrabold tracking-[0.8px] text-label">
          {day.label}
        </span>
        <span className="h-px flex-1 bg-divider" />
      </div>
      {day.posts.length === 0 ? (
        <p className="m-0 text-[14.5px] text-muted">Sin publicaciones.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {day.posts.map((post) => (
            <FamilyPostCard
              key={post.id}
              post={post}
              author={findPostAuthor(post, elderly)}
            />
          ))}
        </div>
      )}
    </section>
  );
}

export function FamilyFeedList({ elderly, initialPage }: FamilyFeedListProps) {
  const [filter, setFilter] = useState<ElderlyFilter>(
    elderly.length > 0
      ? { kind: "elderly", elderlyId: elderly[0].id }
      : { kind: "all" },
  );
  // Las páginas cargadas con "Cargar más" se guardan aparte: al refrescar el servidor reenvía
  // hoy y ayer, y los días anteriores ya cargados se conservan
  const [olderPages, setOlderPages] = useState<FeedPage<FamilyPost>[]>([]);

  const days = [
    ...initialPage.days,
    ...olderPages.flatMap((page) => page.days),
  ];
  const lastOlderPage = olderPages.at(-1);
  const hasMore = lastOlderPage ? lastOlderPage.hasMore : initialPage.hasMore;
  const selectedId = filter.kind === "all" ? null : filter.elderlyId;

  async function loadMore(): Promise<boolean> {
    const oldestDay = days[days.length - 1].date;
    const page = await loadMoreFamilyFeed(oldestDay);
    setOlderPages((current) => [...current, page]);
    return true;
  }

  return (
    <>
      {elderly.length > 1 && (
        <ElderlyFilterChips
          elderly={elderly}
          selectedId={selectedId}
          onSelect={(id) =>
            setFilter(id ? { kind: "elderly", elderlyId: id } : { kind: "all" })
          }
          includeAll
        />
      )}
      {days.map((day) => (
        <FamilyDaySection
          key={day.date}
          day={{
            ...day,
            posts: filterFamilyPosts(day.posts, filter, elderly),
          }}
          elderly={elderly}
        />
      ))}
      {hasMore && <LoadMoreButton onLoad={loadMore} />}
    </>
  );
}
