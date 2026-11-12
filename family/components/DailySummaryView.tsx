"use client";

import { useState } from "react";
import { MealIcon } from "@/shared/components/icons/MealIcon";
import { MoonIcon } from "@/shared/components/icons/MoonIcon";
import { StarIcon } from "@/shared/components/icons/StarIcon";
import { postTypeStyles } from "@/feed/post-type-styles";
import { formatSleepDuration } from "../format-sleep-duration";
import { mockFamily } from "../mock-family";
import { ElderlyFilterChips } from "./ElderlyFilterChips";
import { MoodCard } from "./MoodCard";
import { SummaryHero } from "./SummaryHero";
import { SummaryHighlightItem } from "./SummaryHighlightItem";
import { SummaryStatCard } from "./SummaryStatCard";

export function DailySummaryView() {
  const { elderly, summaries } = mockFamily;
  const [selectedId, setSelectedId] = useState(elderly[0].id);

  const selected = elderly.find(({ id }) => id === selectedId) ?? elderly[0];
  const summary = summaries.find(({ elderlyId }) => elderlyId === selected.id);

  return (
    <div className="mx-auto w-full max-w-[700px] px-4 pt-5 pb-8 lg:px-10 lg:pt-[34px] lg:pb-20">
      <ElderlyFilterChips
        elderly={elderly}
        selectedId={selectedId}
        onSelect={(id) => id && setSelectedId(id)}
      />
      {summary && (
        <>
          <SummaryHero
            displayName={selected.displayName}
            dateLabel={summary.dateLabel}
          />
          <div className="mb-[18px] grid grid-cols-3 gap-2.5 lg:gap-3.5">
            <SummaryStatCard
              icon={MealIcon}
              value={String(summary.mealsCount)}
              label="comidas"
              bgClassName="bg-summary-meal"
              color={postTypeStyles.meal.fg}
            />
            <SummaryStatCard
              icon={MoonIcon}
              value={formatSleepDuration(summary.sleepMinutes)}
              label="de siesta"
              bgClassName="bg-summary-nap"
              color={postTypeStyles.nap.fg}
            />
            <SummaryStatCard
              icon={StarIcon}
              value={String(summary.momentsCount)}
              label="momentos"
              bgClassName="bg-summary-moment"
              color={postTypeStyles.activity.fg}
            />
          </div>
          <MoodCard mood={summary.mood} />
          <h2 className="m-0 mb-3.5 text-[12.5px] font-extrabold tracking-[0.8px] text-label">
            LO MÁS LINDO DE HOY
          </h2>
          <ul className="m-0 flex list-none flex-col gap-[18px] p-0">
            {summary.highlights.map((highlight) => (
              <SummaryHighlightItem key={highlight.id} highlight={highlight} />
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
