import type { ReactNode } from "react";
import { MealIcon } from "@/shared/components/icons/MealIcon";
import { MoonIcon } from "@/shared/components/icons/MoonIcon";
import { StarIcon } from "@/shared/components/icons/StarIcon";
import { postTypeStyles } from "@/feed/post-type-styles";
import { formatSleepDuration } from "../format-sleep-duration";
import type {
  DailySummaryData,
  SummaryDayNav as SummaryDayNavData,
} from "../types";
import { MoodCard } from "./MoodCard";
import { SummaryDayNav } from "./SummaryDayNav";
import { SummaryHero } from "./SummaryHero";
import { SummaryHighlightItem } from "./SummaryHighlightItem";
import { SummaryStatCard } from "./SummaryStatCard";
import { SummaryStatusBadge } from "./SummaryStatusBadge";

type DailySummaryPanelProps = {
  data: DailySummaryData;
  nav: SummaryDayNavData;
  basePath: string;
  extraParams?: Record<string, string>;
  showStatus?: boolean; // solo el equipo ve borrador / sin resumen
  action?: ReactNode; // botón del modal (equipo)
};

export function DailySummaryPanel({
  data,
  nav,
  basePath,
  extraParams,
  showStatus = false,
  action,
}: DailySummaryPanelProps) {
  const emptyHighlightsText =
    data.day === nav.maxDay
      ? "Hoy no hubo momentos registrados."
      : "Ese día no hubo momentos registrados.";

  return (
    <>
      <SummaryHero displayName={data.firstName} dateLabel={data.dateLabel}>
        {showStatus && (
          <div className="mt-3.5 flex flex-wrap items-center gap-3">
            <SummaryStatusBadge status={data.status} />
            {action}
          </div>
        )}
        <SummaryDayNav
          nav={nav}
          day={data.day}
          basePath={basePath}
          extraParams={extraParams}
        />
      </SummaryHero>
      <div className="mb-[18px] grid grid-cols-3 gap-2.5 lg:gap-3.5">
        <SummaryStatCard
          icon={MealIcon}
          value={String(data.mealsCount)}
          label="comidas"
          bgClassName="bg-summary-meal"
          color={postTypeStyles.meal.fg}
        />
        <SummaryStatCard
          icon={MoonIcon}
          value={
            data.sleepMinutes === null
              ? "—"
              : formatSleepDuration(data.sleepMinutes)
          }
          label="de siesta"
          bgClassName="bg-summary-nap"
          color={postTypeStyles.nap.fg}
        />
        <SummaryStatCard
          icon={StarIcon}
          value={String(data.momentsCount)}
          label="momentos"
          bgClassName="bg-summary-moment"
          color={postTypeStyles.activity.fg}
        />
      </div>
      <MoodCard mood={data.mood} />
      <h2 className="m-0 mb-3.5 text-[12.5px] font-extrabold tracking-[0.8px] text-label">
        LO MÁS LINDO DE HOY
      </h2>
      {data.highlights.length === 0 ? (
        <p className="m-0 text-[15px] text-muted-strong">
          {emptyHighlightsText}
        </p>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-[18px] p-0">
          {data.highlights.map((highlight) => (
            <SummaryHighlightItem key={highlight.id} highlight={highlight} />
          ))}
        </ul>
      )}
    </>
  );
}
