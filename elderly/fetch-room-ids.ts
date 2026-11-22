import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

// RLS limita las habitaciones a las de su guardería. null si la consulta falla.
export async function fetchRoomIds(
  supabase: SupabaseClient,
): Promise<string[] | null> {
  const { data, error } = await supabase.from("rooms").select("id");
  if (error) {
    console.error("fetchRoomIds: no se pudieron leer las habitaciones", error);
    return null;
  }
  return data.map((room) => room.id);
}
