import type { Metadata } from "next";
import { Suspense } from "react";
import { buildStaffProfile } from "@/staff/build-staff-profile";
import { StaffProfileContent } from "@/staff/components/StaffProfileContent";
import { StaffProfileSkeleton } from "@/staff/components/StaffProfileSkeleton";
import { getStaffSource } from "@/staff/get-staff-source";

export async function generateMetadata(
  props: PageProps<"/staff/[id]">,
): Promise<Metadata> {
  const { id } = await props.params;
  const profile = buildStaffProfile(await getStaffSource(), id);
  return { title: `${profile?.fullName ?? "Staff"} · Casa Nogal` };
}

export default function StaffProfilePage(props: PageProps<"/staff/[id]">) {
  return (
    <Suspense fallback={<StaffProfileSkeleton />}>
      <StaffProfileContent params={props.params} />
    </Suspense>
  );
}
