import { notFound } from "next/navigation";
import { requireAdminUser } from "@/auth/require-user";
import { buildStaffProfile } from "../build-staff-profile";
import { getStaffSource } from "../get-staff-source";
import { StaffProfileView } from "./StaffProfileView";

type StaffProfileContentProps = {
  params: Promise<{ id: string }>;
};

export async function StaffProfileContent({
  params,
}: StaffProfileContentProps) {
  await requireAdminUser();
  const { id } = await params;
  const profile = buildStaffProfile(await getStaffSource(), id);
  if (!profile) notFound();

  return <StaffProfileView profile={profile} />;
}
