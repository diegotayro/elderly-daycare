import type { Metadata } from "next";
import { Suspense } from "react";
import { TeamDailySummaryContent } from "@/daily-summary/components/TeamDailySummaryContent";
import { TeamDailySummarySkeleton } from "@/daily-summary/components/TeamDailySummarySkeleton";
import { getSummaryElderly } from "@/daily-summary/get-summary-elderly";

export async function generateMetadata(
  props: PageProps<"/elderly/[id]/summary">,
): Promise<Metadata> {
  const { id } = await props.params;
  const fullName = (await getSummaryElderly(id))?.fullName ?? "Adulto mayor";
  return { title: `Resumen del día · ${fullName} · Casa Nogal` };
}

export default function TeamDailySummaryPage(
  props: PageProps<"/elderly/[id]/summary">,
) {
  return (
    <Suspense fallback={<TeamDailySummarySkeleton />}>
      <TeamDailySummaryContent
        params={props.params}
        searchParams={props.searchParams}
      />
    </Suspense>
  );
}
