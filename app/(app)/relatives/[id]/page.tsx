import type { Metadata } from "next";
import { Suspense } from "react";
import { AccountSkeleton } from "@/account/components/AccountSkeleton";
import { RelativeProfileContent } from "@/relatives/components/RelativeProfileContent";
import { getRelativeProfile } from "@/relatives/get-relative-profile";

export async function generateMetadata(
  props: PageProps<"/relatives/[id]">,
): Promise<Metadata> {
  const { id } = await props.params;
  const profile = await getRelativeProfile(id);
  return { title: `${profile?.fullName ?? "Familiar"} · Casa Nogal` };
}

// searchParams es dinámico: se lee dentro de Suspense para que el shell sea estático
export default function RelativeProfilePage(
  props: PageProps<"/relatives/[id]">,
) {
  return (
    <Suspense
      fallback={
        <AccountSkeleton
          withElderlyCard
          withNotifications={false}
          withActions={false}
        />
      }
    >
      <RelativeProfileContent
        params={props.params}
        searchParams={props.searchParams}
      />
    </Suspense>
  );
}
