import { requireRelativeUser } from "@/auth/require-user";
import { DailySummaryPanel } from "@/daily-summary/components/DailySummaryPanel";
import { SummaryDayNav } from "@/daily-summary/components/SummaryDayNav";
import { SummaryEmptyState } from "@/daily-summary/components/SummaryEmptyState";
import { fetchDailySummary } from "@/daily-summary/fetch-daily-summary";
import { fetchLatestSentDay } from "@/daily-summary/fetch-latest-sent-day";
import { fetchSummaryDayNav } from "@/daily-summary/fetch-summary-day-nav";
import { parseSummaryDate } from "@/daily-summary/parse-summary-date";
import { getLimaToday } from "@/shared/date/get-lima-today";
import { fetchFamilyFeedElderly } from "../fetch-family-feed-elderly";
import { DailySummaryView } from "./DailySummaryView";

const SUMMARY_PATH = "/family/summary";

type DailySummaryContentProps = {
  searchParams: Promise<{
    elderly?: string | string[];
    date?: string | string[];
  }>;
};

export async function DailySummaryContent({
  searchParams,
}: DailySummaryContentProps) {
  const user = await requireRelativeUser();
  const [elderly, params] = await Promise.all([
    fetchFamilyFeedElderly(user.id),
    searchParams,
  ]);

  if (elderly.length === 0) {
    return (
      <DailySummaryView elderly={elderly} selectedId="">
        <SummaryEmptyState title="No tienes adultos mayores vinculados" />
      </DailySummaryView>
    );
  }

  // Un id ajeno o inválido cae en el primer adulto mayor propio
  const selected =
    elderly.find(({ id }) => id === params.elderly) ?? elderly[0];
  const today = getLimaToday();
  const day =
    parseSummaryDate(params.date, today) ??
    (await fetchLatestSentDay(selected.id));

  if (!day) {
    return (
      <DailySummaryView elderly={elderly} selectedId={selected.id}>
        <SummaryEmptyState
          title={`Todavía no hay resúmenes de ${selected.firstName}`}
        />
      </DailySummaryView>
    );
  }

  const [data, nav] = await Promise.all([
    fetchDailySummary({
      elderlyId: selected.id,
      firstName: selected.firstName,
      day,
      audience: "family",
    }),
    fetchSummaryDayNav({
      elderlyId: selected.id,
      day,
      today,
      audience: "family",
    }),
  ]);
  const extraParams = { elderly: selected.id };

  return (
    <DailySummaryView elderly={elderly} selectedId={selected.id}>
      {data.status.kind === "sent" ? (
        <DailySummaryPanel
          data={data}
          nav={nav}
          basePath={SUMMARY_PATH}
          extraParams={extraParams}
        />
      ) : (
        <>
          <SummaryEmptyState
            title="No hay resumen de este día"
            description={data.dateLabel}
          />
          <SummaryDayNav
            nav={nav}
            day={day}
            basePath={SUMMARY_PATH}
            extraParams={extraParams}
          />
        </>
      )}
    </DailySummaryView>
  );
}
