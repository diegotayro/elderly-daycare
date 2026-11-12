import { Suspense, type ReactNode } from "react";
import { CurrentFamilySidebar } from "@/family/components/CurrentFamilySidebar";
import { CurrentUserMobileTopBar } from "@/shared/components/navigation/CurrentUserMobileTopBar";
import { MobileBottomNav } from "@/shared/components/navigation/MobileBottomNav";
import { MobileTopBar } from "@/shared/components/navigation/MobileTopBar";
import { Sidebar } from "@/shared/components/navigation/Sidebar";

export default function FamilyLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-cream lg:flex-row">
      <Suspense fallback={<Sidebar variant="family" />}>
        <CurrentFamilySidebar />
      </Suspense>
      <Suspense fallback={<MobileTopBar variant="family" />}>
        <CurrentUserMobileTopBar variant="family" />
      </Suspense>
      <main className="min-w-0 flex-1 pb-16 lg:pb-0">{children}</main>
      <MobileBottomNav variant="family" />
    </div>
  );
}
