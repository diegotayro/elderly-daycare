import type { Metadata } from "next";
import { Suspense } from "react";
import { StaffListContent } from "@/staff/components/StaffListContent";
import { StaffListSkeleton } from "@/staff/components/StaffListSkeleton";

export const metadata: Metadata = {
  title: "Staff · Casa Nogal",
};

// searchParams es dinámico: se lee dentro de Suspense para que el shell sea estático
export default function StaffPage(props: PageProps<"/staff">) {
  return (
    <Suspense fallback={<StaffListSkeleton />}>
      <StaffListContent searchParams={props.searchParams} />
    </Suspense>
  );
}
