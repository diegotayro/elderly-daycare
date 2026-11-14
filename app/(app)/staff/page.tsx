import type { Metadata } from "next";
import { Suspense } from "react";
import { StaffListContent } from "@/staff/components/StaffListContent";
import { StaffListSkeleton } from "@/staff/components/StaffListSkeleton";

export const metadata: Metadata = {
  title: "Staff · Casa Nogal",
};

export default function StaffPage() {
  return (
    <Suspense fallback={<StaffListSkeleton />}>
      <StaffListContent />
    </Suspense>
  );
}
