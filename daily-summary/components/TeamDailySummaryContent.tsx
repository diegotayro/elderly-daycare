import { notFound } from "next/navigation";
import { io } from "next/cache";
import Link from "next/link";
import { requireTeamUser } from "@/auth/require-user";
import { ChevronLeftIcon } from "@/shared/components/icons/ChevronLeftIcon";
import { shiftDay } from "@/shared/date/shift-day";
import { getLimaToday } from "@/shared/date/get-lima-today";
import { fetchDailySummary } from "../fetch-daily-summary";
import { fetchSummaryDayNav } from "../fetch-summary-day-nav";
import { getSummaryElderly } from "../get-summary-elderly";
import { parseSummaryDate } from "../parse-summary-date";
import { DailySummaryDialog } from "./DailySummaryDialog";
import { DailySummaryPanel } from "./DailySummaryPanel";

type TeamDailySummaryContentProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ date?: string | string[] }>;
};

export async function TeamDailySummaryContent({
  params,
  searchParams,
}: TeamDailySummaryContentProps) {
  const user = await requireTeamUser();
  const { id } = await params;
  const elderly = await getSummaryElderly(id);
  // El staff no ve archivados aunque la RLS se lo permita
  if (!elderly || (elderly.status === "archived" && user.role !== "admin")) {
    notFound();
  }

  // La fecha de hoy debe quedar fuera del prerender
  await io();
  const today = getLimaToday();
  const day = parseSummaryDate((await searchParams).date, today) ?? today;

  const [data, nav] = await Promise.all([
    fetchDailySummary({
      elderlyId: id,
      firstName: elderly.firstName,
      day,
      audience: "team",
    }),
    fetchSummaryDayNav({ elderlyId: id, day, today, audience: "team" }),
  ]);

  const isWritableDay = day === today || day === shiftDay(today, -1);
  const canEdit = isWritableDay && elderly.status === "active";

  return (
    <div className="mx-auto w-full max-w-[700px] px-4 pt-5 pb-8 lg:px-10 lg:pt-[34px] lg:pb-20">
      <Link
        href={`/elderly/${id}`}
        className="mb-5 flex items-center gap-[7px] text-sm leading-[normal] font-bold text-muted-strong"
      >
        <ChevronLeftIcon size={18} />
        {elderly.fullName}
      </Link>
      <DailySummaryPanel
        data={data}
        nav={nav}
        basePath={`/elderly/${id}/summary`}
        showStatus
        action={canEdit && <DailySummaryDialog elderlyId={id} data={data} />}
      />
    </div>
  );
}
