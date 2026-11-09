import { requireTeamUser } from "@/auth/require-user";
import { FeedView } from "@/feed/components/FeedView";
import { mockFeed } from "@/feed/mock-feed";

export default async function Home() {
  await requireTeamUser();

  return <FeedView source={mockFeed} />;
}
