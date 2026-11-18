import "server-only";
import { cookies } from "next/headers";
import { getAvatarTone } from "@/elderly/get-avatar-tone";
import { createClient } from "@/shared/supabase/server";
import type { FamilyFeedElderly } from "./types";

type GuardianLinkRow = {
  elderly: { id: string; first_name: string; room_id: string };
};

// Adultos mayores activos vinculados al familiar, con su habitación (para el filtro del feed).
// Con la sesión del familiar: la RLS ya limita a sus vínculos, el filtro lo deja explícito.
export async function fetchFamilyFeedElderly(
  relativeId: string,
): Promise<FamilyFeedElderly[]> {
  const supabase = createClient(await cookies());

  const { data, error } = await supabase
    .from("guardian_elderly")
    .select("created_at, elderly!inner(id, first_name, room_id, status)")
    .eq("relative_id", relativeId)
    .eq("elderly.status", "active")
    .order("created_at", { ascending: true })
    .overrideTypes<GuardianLinkRow[], { merge: false }>();
  if (error) throw error;

  return data.map(({ elderly }) => ({
    id: elderly.id,
    firstName: elderly.first_name,
    initial: elderly.first_name.charAt(0).toUpperCase(),
    tone: getAvatarTone(elderly.id),
    roomId: elderly.room_id,
  }));
}
