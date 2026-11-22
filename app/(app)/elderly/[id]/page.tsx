import type { Metadata } from "next";
import { Suspense } from "react";
import { getCurrentUser } from "@/auth/get-current-user";
import { ElderlyProfileContent } from "@/elderly/components/ElderlyProfileContent";
import { ElderlyProfileSkeleton } from "@/elderly/components/ElderlyProfileSkeleton";
import { getElderlyProfileSource } from "@/elderly/get-elderly-profile-source";

export async function generateMetadata(
  props: PageProps<"/elderly/[id]">,
): Promise<Metadata> {
  const { id } = await props.params;
  const isAdmin = (await getCurrentUser())?.role === "admin";
  const source = await getElderlyProfileSource(id, isAdmin);
  const fullName = source?.elderly[0].full_name ?? "Adulto mayor";
  return { title: `${fullName} · Casa Nogal` };
}

export default function ElderlyProfilePage(props: PageProps<"/elderly/[id]">) {
  return (
    <Suspense fallback={<ElderlyProfileSkeleton />}>
      <ElderlyProfileContent params={props.params} />
    </Suspense>
  );
}
