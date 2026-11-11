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
  const isAdmin = user.role === "admin";
  const profile = buildElderlyProfile(source, id, { isAdmin });
  if (!profile || (profile.isArchived && !isAdmin)) notFound();

  return <ElderlyProfileView profile={profile} />;
}
