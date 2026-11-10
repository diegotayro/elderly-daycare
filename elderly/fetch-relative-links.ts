import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { GuardianElderly, User } from "@/shared/database/types";

type RelativeLinks = { guardianElderly: GuardianElderly[]; relatives: User[] };

// Sin elderlyIds trae todos los vínculos visibles por RLS
export async function fetchRelativeLinks(
  supabase: SupabaseClient,
  elderlyIds?: string[],
): Promise<RelativeLinks> {
  let linksQuery = supabase.from("guardian_elderly").select("*");
  if (elderlyIds) linksQuery = linksQuery.in("elderly_id", elderlyIds);

  const linksResult = await linksQuery;
  if (linksResult.error) throw linksResult.error;
  const guardianElderly: GuardianElderly[] = linksResult.data;

  const relativeIds = [
    ...new Set(guardianElderly.map((link) => link.relative_id)),
  ];
  if (relativeIds.length === 0) return { guardianElderly, relatives: [] };

  const relativesResult = await supabase
    .from("users")
    .select("*")
    .eq("role", "relative")
    .in("id", relativeIds);
  if (relativesResult.error) throw relativesResult.error;

  return { guardianElderly, relatives: relativesResult.data as User[] };
}
