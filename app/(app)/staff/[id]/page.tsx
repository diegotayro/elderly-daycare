import type { Metadata } from "next";
import { Suspense } from "react";
import { StaffProfileContent } from "@/staff/components/StaffProfileContent";
import { StaffProfileSkeleton } from "@/staff/components/StaffProfileSkeleton";
import { getStaffProfileSource } from "@/staff/get-staff-profile-source";

export async function generateMetadata(
  props: PageProps<"/staff/[id]">,
): Promise<Metadata> {
  const { id } = await props.params;
  const source = await getStaffProfileSource(id);
  const fullName = source?.staff[0].full_name ?? "Staff";
  return { title: `${fullName} · Casa Nogal` };
}

export default function StaffProfilePage(props: PageProps<"/staff/[id]">) {
  return (
    <Suspense fallback={<StaffProfileSkeleton />}>
      <StaffProfileContent params={props.params} />
    </Suspense>
  );
}
