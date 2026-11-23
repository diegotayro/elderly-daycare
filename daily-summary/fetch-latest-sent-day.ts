import "server-only";
import { cookies } from "next/headers";
import { createClient } from "@/shared/supabase/server";

// Día del último resumen enviado del adulto mayor; null si no hay ninguno
export async function fetchLatestSentDay(
  elderlyId: string,
): Promise<string | null> {
  const supabase = createClient(await cookies());

  const { data, error } = await supabase
    .from("daily_summaries")
    .select("date")
    .eq("elderly_id", elderlyId)
    .not("sent_at", "is", null)
    .order("date", { ascending: false })
    .limit(1)
    .maybeSingle<{ date: string }>();
  if (error) throw error;
  return data?.date ?? null;
}
