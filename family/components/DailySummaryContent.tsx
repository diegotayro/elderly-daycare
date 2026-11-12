import { requireRelativeUser } from "@/auth/require-user";
import { DailySummaryView } from "./DailySummaryView";

export async function DailySummaryContent() {
  await requireRelativeUser();

  return <DailySummaryView />;
}
