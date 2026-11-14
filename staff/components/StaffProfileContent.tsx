import { notFound } from "next/navigation";
import { requireAdminUser } from "@/auth/require-user";
import { buildStaffProfile } from "../build-staff-profile";
import { getStaffProfileSource } from "../get-staff-profile-source";
import { StaffProfileView } from "./StaffProfileView";

type StaffProfileContentProps = {
  params: Promise<{ id: string }>;
};

export async function StaffProfileContent({
  params,
}: StaffProfileContentProps) {
  await requireAdminUser();
  const { id } = await params;
  const source = await getStaffProfileSource(id);
  const profile = source && buildStaffProfile(source, id);
  if (!profile) notFound();

  return <StaffProfileView profile={profile} />;
}
