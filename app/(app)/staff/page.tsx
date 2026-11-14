import type { Metadata } from "next";
import { Suspense } from "react";
import { StaffListContent } from "@/staff/components/StaffListContent";

export const metadata: Metadata = {
  title: "Staff · Casa Nogal",
};

export default function StaffPage() {
  return (
    <Suspense>
      <StaffListContent />
    </Suspense>
  );
}
