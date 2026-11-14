import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

type StaffEmailRow = { id: string; email: string };

// Solo el admin recibe filas (get_staff_emails() lo hace cumplir)
export async function fetchStaffEmails(
  supabase: SupabaseClient,
): Promise<Map<string, string>> {
  const result = await supabase.rpc("get_staff_emails");
  if (result.error) throw result.error;

  const rows = result.data as StaffEmailRow[];
  return new Map(rows.map((row) => [row.id, row.email]));
}
