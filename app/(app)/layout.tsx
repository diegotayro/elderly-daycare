import { Suspense } from "react";
import { NewPostDialogProvider } from "@/feed/components/NewPostDialogProvider";
import { buildNewPostOptions } from "@/feed/build-new-post-options";
import { mockElderly } from "@/elderly/mock-elderly";
import { CurrentUserMobileTopBar } from "@/shared/components/navigation/CurrentUserMobileTopBar";
import { CurrentUserSidebar } from "@/shared/components/navigation/CurrentUserSidebar";
import { CurrentUserMobileBottomNav } from "@/shared/components/navigation/CurrentUserMobileBottomNav";
import { MobileBottomNav } from "@/shared/components/navigation/MobileBottomNav";
import { MobileTopBar } from "@/shared/components/navigation/MobileTopBar";
import { Sidebar } from "@/shared/components/navigation/Sidebar";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <NewPostDialogProvider options={buildNewPostOptions(mockElderly)}>
      <div className="flex min-h-screen flex-col bg-cream lg:flex-row">
        <Suspense fallback={<Sidebar variant="team" />}>
          <CurrentUserSidebar />
        </Suspense>
        <Suspense fallback={<MobileTopBar variant="team" />}>
          <CurrentUserMobileTopBar variant="team" />
        </Suspense>
        <main className="min-w-0 flex-1 pb-16 lg:pb-0">{children}</main>
        <Suspense fallback={<MobileBottomNav variant="team" />}>
          <CurrentUserMobileBottomNav variant="team" />
        </Suspense>
      </div>
    </NewPostDialogProvider>
  );
}
