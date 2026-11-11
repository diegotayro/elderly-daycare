import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Invitation } from "@/shared/database/types";

// Solo invitaciones pendientes y vigentes. RLS devuelve [] si no es admin.
// Sin elderlyIds trae todas las visibles. Llamar después de `await io()`.
export async function fetchPendingInvitations(
  supabase: SupabaseClient,
  elderlyIds?: string[],
): Promise<Invitation[]> {
  let query = supabase
    .from("invitations")
    .select("*")
    .eq("status", "pending")
    .gt("expires_at", new Date().toISOString());
  if (elderlyIds) query = query.in("elderly_id", elderlyIds);

  const { data, error } = await query;
  if (error) throw error;
  return data;
}
