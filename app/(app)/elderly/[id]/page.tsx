import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { buildElderlyProfile } from "@/elderly/build-elderly-profile";
import { ElderlyProfileView } from "@/elderly/components/ElderlyProfileView";
import { mockElderly } from "@/elderly/mock-elderly";

export function generateStaticParams() {
  return mockElderly.elderly.map(({ id }) => ({ id }));
}

export async function generateMetadata(
  props: PageProps<"/elderly/[id]">,
): Promise<Metadata> {
  const { id } = await props.params;
  const profile = buildElderlyProfile(mockElderly, id);
  return { title: `${profile?.fullName ?? "Adulto mayor"} · Casa Nogal` };
}

export default async function ElderlyProfilePage(
  props: PageProps<"/elderly/[id]">,
) {
  const { id } = await props.params;
  const profile = buildElderlyProfile(mockElderly, id);
  if (!profile) notFound();

  return <ElderlyProfileView profile={profile} />;
}
