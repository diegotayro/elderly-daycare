import { cookies } from "next/headers";
import { requireTeamUser } from "@/auth/require-user";
import { UrlNoticeToast } from "@/shared/components/toast/UrlNoticeToast";
import { getLimaToday } from "@/shared/date/get-lima-today";
import { createClient } from "@/shared/supabase/server";
import { getCurrentUserPhotoUrl } from "@/users/get-current-user-photo-url";
import { buildFeed } from "../build-feed";
import { buildTodayLabel } from "../build-day-label";
import { feedNoticeMessages } from "../delete-post-messages";
import { getInitialFeedDays } from "../get-feed-days";
import { readFeedNotice } from "../read-feed-notice";
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

type FeedContentProps = Pick<PageProps<"/">, "searchParams">;

export async function FeedContent({ searchParams }: FeedContentProps) {
  const user = await requireTeamUser();
  const today = getLimaToday();
  const notice = readFeedNotice((await searchParams).notice);

  const [elderlyCount, dataPage, photoUrl] = await Promise.all([
    countVisibleActiveElderly(),
    getInitialFeedDays(today, user.id),
    getCurrentUserPhotoUrl(),
  ]);
  const initialPage = buildFeed(dataPage, { currentUserId: user.id, today });

  return (
    <>
      <FeedView
        daycareName={user.daycareName}
        userFirstName={user.first_name}
        userPhotoUrl={photoUrl}
        elderlyCount={elderlyCount}
        todayLabel={buildTodayLabel(today)}
        initialPage={initialPage}
      />
      <UrlNoticeToast
        message={notice && feedNoticeMessages[notice]}
        clearHref="/"
      />
    </>
  );
}
