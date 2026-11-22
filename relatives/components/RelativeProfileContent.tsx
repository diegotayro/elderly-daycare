import { notFound } from "next/navigation";
import { requireAdminOrNotFound } from "@/auth/require-user";
import { FamilyAccountView } from "@/family/components/FamilyAccountView";
import { buildBackHref } from "../build-back-href";
import { getRelativeProfile } from "../get-relative-profile";
import { RelativeProfileHeading } from "./RelativeProfileHeading";

type RelativeProfileContentProps = Pick<
  PageProps<"/relatives/[id]">,
  "params" | "searchParams"
>;

export async function RelativeProfileContent({
  params,
  searchParams,
}: RelativeProfileContentProps) {
  await requireAdminOrNotFound();
  const [{ id }, { from }] = await Promise.all([params, searchParams]);

  const profile = await getRelativeProfile(id);
  if (!profile) notFound();

  // El admin no cambia la foto de quien está archivado, pero sí puede quitarla
  const isArchived = profile.status === "archived";

  return (
    <FamilyAccountView
      mode="admin"
      userId={profile.id}
      fullName={profile.fullName}
      email={profile.email}
      photoUrl={profile.photoUrl}
      elderly={profile.elderly}
      avatarPermissions={{ canChange: !isArchived, canRemove: true }}
      canEdit={!isArchived}
      heading={
        <RelativeProfileHeading
          fullName={profile.fullName}
          backHref={buildBackHref(from)}
        />
      }
    />
  );
}
