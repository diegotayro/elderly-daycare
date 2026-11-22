import "server-only";
import { io } from "next/cache";
import { cookies } from "next/headers";
import { formatAge } from "@/elderly/elderly-formatters";
import { getAvatarTone } from "@/elderly/get-avatar-tone";
import type { ElderlyStatus, RelationshipType } from "@/shared/database/types";
import { getLimaToday } from "@/shared/date/get-lima-today";
import { createClient } from "@/shared/supabase/server";
import type { FamilyAccountElderly } from "./types";

type GuardianLinkRow = {
  relationship: RelationshipType;
  elderly: {
    id: string;
    first_name: string;
    full_name: string;
    birth_date: string;
    status: ElderlyStatus;
    photo_consent: boolean;
    room: { name: string };
  };
};

// Todos los adultos mayores vinculados al familiar, activos primero y archivados al final;
// dentro de cada grupo, en el orden de los vínculos (el primero vinculado va primero).
// La usan /family/account (el propio familiar) y /relatives/[id] (el admin): la RLS lo permite a los dos.
export async function fetchAccountElderly(
  relativeId: string,
): Promise<FamilyAccountElderly[]> {
  // La fecha de hoy debe quedar fuera del prerender
  await io();
  const today = getLimaToday();

  const supabase = createClient(await cookies());
  const { data, error } = await supabase
    .from("guardian_elderly")
    .select(
      "relationship, created_at, elderly!inner(id, first_name, full_name, birth_date, status, photo_consent, room:rooms!inner(name))",
    )
    .eq("relative_id", relativeId)
    .order("created_at", { ascending: true })
    .order("id", { ascending: true })
    .overrideTypes<GuardianLinkRow[], { merge: false }>();
  if (error) throw error;

  const links = data.map(
    ({ relationship, elderly }): FamilyAccountElderly => ({
      id: elderly.id,
      fullName: elderly.full_name,
      initial: elderly.first_name.charAt(0).toUpperCase(),
      tone: getAvatarTone(elderly.id),
      ageLabel: formatAge(elderly.birth_date, today),
      roomName: elderly.room.name,
      photoConsent: elderly.photo_consent,
      isArchived: elderly.status === "archived",
      relationship,
    }),
  );

  return [
    ...links.filter(({ isArchived }) => !isArchived),
    ...links.filter(({ isArchived }) => isArchived),
  ];
}
