import { requireRelativeUser } from "@/auth/require-user";
import { getInitialFeedDays } from "@/feed/get-feed-days";
import { getLimaToday } from "@/shared/date/get-lima-today";
import { buildFamilyFeed } from "../build-family-feed";
import { fetchFamilyFeedElderly } from "../fetch-family-feed-elderly";
import { FamilyFeedView } from "./FamilyFeedView";

export async function FamilyFeedContent() {
  const user = await requireRelativeUser();
  const today = getLimaToday();

  const [elderly, dataPage] = await Promise.all([
    fetchFamilyFeedElderly(user.id),
    getInitialFeedDays(today),
  ]);
  const initialPage = buildFamilyFeed(dataPage, { today, elderly });

  return (
    <FamilyFeedView
      firstName={user.first_name}
      elderly={elderly}
      initialPage={initialPage}
    />
  );
}
