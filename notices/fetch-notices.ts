import "server-only";
import { cookies } from "next/headers";
import type { CurrentUser } from "@/auth/types";
import type { ListNoticesRow } from "@/shared/database/types";
import { getLimaDay } from "@/shared/date/get-lima-today";
import { createClient } from "@/shared/supabase/server";
import { buildNotices, getReminderInstant } from "./build-notices";
import { NOTICES_LIMIT, NOTICES_WINDOW_DAYS } from "./notice-limits";
import type { Notice } from "./types";

type SupabaseClient = ReturnType<typeof createClient>;

const DAY_MS = 24 * 60 * 60 * 1000;

// La RLS del staff solo deja ver a sus adultos mayores asignados
async function fetchActiveAssignedElderlyIds(
  supabase: SupabaseClient,
): Promise<string[]> {
  const { data, error } = await supabase
    .from("elderly")
    .select("id")
    .eq("status", "active");
  if (error) throw error;
  return data.map(({ id }: { id: string }) => id);
}

async function fetchSentSummaryElderlyIds(
  supabase: SupabaseClient,
  day: string,
): Promise<Set<string>> {
  const { data, error } = await supabase
    .from("daily_summaries")
    .select("elderly_id")
    .eq("date", day)
    .not("sent_at", "is", null);
  if (error) throw error;
  return new Set(data.map(({ elderly_id }: { elderly_id: string }) => elderly_id));
}

// Hay recordatorio mientras algún adulto mayor activo asignado no tenga el resumen de hoy enviado
async function hasPendingSummary(
  supabase: SupabaseClient,
  now: Date,
): Promise<boolean> {
  const [elderlyIds, sentIds] = await Promise.all([
    fetchActiveAssignedElderlyIds(supabase),
    fetchSentSummaryElderlyIds(supabase, getLimaDay(now)),
  ]);
  return elderlyIds.some((id) => !sentIds.has(id));
}

async function shouldIncludeReminder(
  supabase: SupabaseClient,
  user: CurrentUser,
  now: Date,
): Promise<boolean> {
  if (user.role !== "staff" || !user.daily_summary_enabled) return false;
  if (now < getReminderInstant(now)) return false;
  return hasPendingSummary(supabase, now);
}

export async function fetchNotices(user: CurrentUser): Promise<Notice[]> {
  const supabase = createClient(await cookies());
  const now = new Date();
  const since = new Date(now.getTime() - NOTICES_WINDOW_DAYS * DAY_MS);

  // El cliente no está tipado con Database: se declara la forma que devuelve list_notices
  const { data, error } = await supabase.rpc("list_notices", {
    p_since: since.toISOString(),
    p_limit: NOTICES_LIMIT,
  });
  if (error) throw error;
  const rows = (data ?? []) as ListNoticesRow[];

  const includeReminder = await shouldIncludeReminder(supabase, user, now);
  return buildNotices(rows, now, includeReminder);
}
