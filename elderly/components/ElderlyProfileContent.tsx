import { notFound } from "next/navigation";
import { requireTeamUser } from "@/auth/require-user";
import { buildElderlyProfile } from "../build-elderly-profile";
import { getElderlyProfileSource } from "../get-elderly-profile-source";
import { ElderlyProfileView } from "./ElderlyProfileView";

type ElderlyProfileContentProps = {
  params: Promise<{ id: string }>;
};

export async function ElderlyProfileContent({
  params,
}: ElderlyProfileContentProps) {
  const user = await requireTeamUser();
  const { id } = await params;
  const source = await getElderlyProfileSource(id);
  if (!source) notFound();

  // El staff no ve archivados aunque RLS se lo permita
  const isArchived = source.elderly[0].status === "archived";
  if (isArchived && user.role !== "admin") notFound();

  const profile = buildElderlyProfile(source, id);
  if (!profile) notFound();

  return <ElderlyProfileView profile={profile} />;
}
