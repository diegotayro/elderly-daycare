import { cookies } from "next/headers";
import { requireTeamUser } from "@/auth/require-user";
import { getLimaToday } from "@/shared/date/get-lima-today";
import { createClient } from "@/shared/supabase/server";
import { getCurrentUserPhotoUrl } from "@/users/get-current-user-photo-url";
import { buildFeed } from "../build-feed";
import { buildTodayLabel } from "../build-day-label";
import { getInitialFeedDays } from "../get-feed-days";
import { FeedView } from "./FeedView";

async function countVisibleActiveElderly(): Promise<number> {
  const supabase = createClient(await cookies());
  const { count, error } = await supabase
    .from("elderly")
    .select("id", { count: "exact", head: true })
    .eq("status", "active");
  if (error) throw error;
  return count ?? 0;
}

export async function FeedContent() {
  const user = await requireTeamUser();
  const today = getLimaToday();

  const [elderlyCount, dataPage, photoUrl] = await Promise.all([
    countVisibleActiveElderly(),
    getInitialFeedDays(today, user.id),
    getCurrentUserPhotoUrl(),
  ]);
  const initialPage = buildFeed(dataPage, { currentUserId: user.id, today });

  return (
    <FeedView
      daycareName={user.daycareName}
      userFirstName={user.first_name}
      userPhotoUrl={photoUrl}
      elderlyCount={elderlyCount}
      todayLabel={buildTodayLabel(today)}
      initialPage={initialPage}
    />
  );
}
