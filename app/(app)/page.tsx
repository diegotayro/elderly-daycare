import { FeedView } from "@/feed/components/FeedView";
import { mockFeed } from "@/feed/mock-feed";

export default function Home() {
  return <FeedView source={mockFeed} />;
}
