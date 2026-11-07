import { NewPostDialogProvider } from "@/feed/components/NewPostDialogProvider";
import { buildNewPostOptions } from "@/feed/build-new-post-options";
import { mockElderly } from "@/elderly/mock-elderly";
import { MobileBottomNav } from "@/shared/components/navigation/MobileBottomNav";
import { MobileTopBar } from "@/shared/components/navigation/MobileTopBar";
import { Sidebar } from "@/shared/components/navigation/Sidebar";
import { mockSession } from "@/shared/session/mock-session";
import { userRoleLabels } from "@/users/user-role-labels";

export default function AppLayout({ children }: LayoutProps<"/">) {
  const { daycare, currentUser } = mockSession;

  return (
    <NewPostDialogProvider options={buildNewPostOptions(mockElderly)}>
      <div className="flex min-h-screen flex-col bg-cream lg:flex-row">
        <Sidebar
          daycareName={daycare.name}
          userName={currentUser.full_name}
          userRoleLabel={userRoleLabels[currentUser.role]}
        />
        <MobileTopBar daycareName={daycare.name} />
        <main className="min-w-0 flex-1 pb-16 lg:pb-0">{children}</main>
        <MobileBottomNav />
      </div>
    </NewPostDialogProvider>
  );
}
