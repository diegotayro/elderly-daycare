"use client";

import { useState } from "react";
import { filterFamilyPosts } from "../filter-family-posts";
import type { ElderlyFilter, FamilyElderly, FamilyPost } from "../types";
import { ElderlyFilterChips } from "./ElderlyFilterChips";
import { FamilyPostCard } from "./FamilyPostCard";

type FamilyFeedListProps = {
  elderly: FamilyElderly[];
  posts: FamilyPost[];
  todayLabel: string;
};

export function FamilyFeedList({
  elderly,
  posts,
  todayLabel,
}: FamilyFeedListProps) {
  const [filter, setFilter] = useState<ElderlyFilter>({
    kind: "elderly",
    elderlyId: elderly[0].id,
  });
  const visiblePosts = filterFamilyPosts(posts, filter);
  const selectedId = filter.kind === "all" ? null : filter.elderlyId;

  const findAuthor = ({ elderlyIds }: FamilyPost) => {
    const owner = elderly.find(({ id }) => id === elderlyIds[0]);
    return owner ? { initial: owner.initial, tone: owner.tone } : null;
  };

  return (
    <>
      <ElderlyFilterChips
        elderly={elderly}
        selectedId={selectedId}
        onSelect={(id) =>
          setFilter(id ? { kind: "elderly", elderlyId: id } : { kind: "all" })
        }
        includeAll
      />
      <div className="mb-3.5 flex items-center gap-3.5">
        <span className="text-[12.5px] font-extrabold tracking-[0.8px] text-label">
          HOY · {todayLabel}
        </span>
        <span className="h-px flex-1 bg-divider" />
      </div>
      {visiblePosts.length === 0 ? (
        <div className="rounded-[20px] border border-line bg-surface px-[22px] py-10 text-center text-[15.5px] text-muted-strong shadow-[0_4px_16px_-12px_rgba(120,90,60,0.5)]">
          Todavía no hay publicaciones de hoy.
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {visiblePosts.map((post) => (
            <FamilyPostCard
              key={post.id}
              post={post}
              author={findAuthor(post)}
            />
          ))}
        </div>
      )}
    </>
  );
}
