import type { Metadata } from "next";
import { Suspense } from "react";
import { AccountSkeleton } from "@/account/components/AccountSkeleton";
import { FamilyAccountContent } from "@/family/components/FamilyAccountContent";

export const metadata: Metadata = {
  title: "Mi cuenta · Casa Nogal",
};

export default function FamilyAccountPage() {
  return (
    <Suspense fallback={<AccountSkeleton withElderlyCard />}>
      <FamilyAccountContent />
    </Suspense>
  );
}
