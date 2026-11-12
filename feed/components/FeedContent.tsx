import { requireTeamUser } from "@/auth/require-user";
import { mockFeed } from "../mock-feed";
import { FeedView } from "./FeedView";

export async function FeedContent() {
  await requireTeamUser();

  return <FeedView source={mockFeed} />;
}
