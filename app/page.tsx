import { mockFeed } from "@/feed/mock-feed";
import { Sidebar } from "@/shared/components/navigation/Sidebar";
import { userRoleLabels } from "@/users/user-role-labels";

export default function Home() {
  const { daycare, currentUser } = mockFeed;

  return (
    <div className="flex min-h-screen bg-cream">
      <Sidebar
        daycareName={daycare.name}
        userName={currentUser.full_name}
        userRoleLabel={userRoleLabels[currentUser.role]}
        activeKey="feed"
      />
      <main className="min-w-0 flex-1">
        <h1 className="p-8 font-display text-3xl font-semibold">Casa Nogal</h1>
      </main>
    </div>
  );
}
