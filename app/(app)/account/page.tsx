import type { Metadata } from "next";
import { Suspense } from "react";
import { AccountContent } from "@/account/components/AccountContent";
import { AccountSkeleton } from "@/account/components/AccountSkeleton";

export const metadata: Metadata = {
  title: "Mi cuenta · Casa Nogal",
};

export default function AccountPage() {
  return (
    <Suspense fallback={<AccountSkeleton />}>
      <AccountContent />
    </Suspense>
  );
}
