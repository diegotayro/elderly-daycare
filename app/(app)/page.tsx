import { FeedView } from "@/feed/components/FeedView";
import { mockFeed } from "@/feed/mock-feed";
import { MobileBottomNav } from "@/shared/components/navigation/MobileBottomNav";
import { MobileTopBar } from "@/shared/components/navigation/MobileTopBar";
import { Sidebar } from "@/shared/components/navigation/Sidebar";
import { userRoleLabels } from "@/users/user-role-labels";

export default function Home() {
  const { daycare, currentUser } = mockFeed;

  return (
    <div className="flex min-h-screen flex-col bg-cream lg:flex-row">
      <Sidebar
        daycareName={daycare.name}
        userName={currentUser.full_name}
        userRoleLabel={userRoleLabels[currentUser.role]}
        activeKey="feed"
      />
      <MobileTopBar daycareName={daycare.name} />
      <main className="min-w-0 flex-1 pb-16 lg:pb-0">
        <FeedView source={mockFeed} />
      </main>
      <MobileBottomNav activeKey="feed" />
    </div>
  );
}
