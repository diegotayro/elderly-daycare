import "server-only";
import { cookies } from "next/headers";
import { createClient } from "@/shared/supabase/server";
import type { RelationshipType } from "@/shared/database/types";
import type { SidebarElderlyLink } from "./types";

type GuardianLinkRow = {
  relationship: RelationshipType;
  elderly: { first_name: string };
};

// Con la sesión del familiar: la RLS ya limita a sus vínculos, el filtro lo deja explícito
export async function fetchSidebarElderlyLinks(
  relativeId: string,
): Promise<SidebarElderlyLink[]> {
  const supabase = createClient(await cookies());

  const { data, error } = await supabase
    .from("guardian_elderly")
    .select("relationship, created_at, elderly!inner(first_name, status)")
    .eq("relative_id", relativeId)
    .eq("elderly.status", "active")
    .order("created_at", { ascending: true })
    .overrideTypes<GuardianLinkRow[], { merge: false }>();
  if (error) throw error;

  return data.map(({ relationship, elderly }) => ({
    firstName: elderly.first_name,
    relationship,
  }));
}
