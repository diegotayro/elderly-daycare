import "server-only";
import { cookies } from "next/headers";
import type { CurrentUser } from "@/auth/types";
import type { ListNoticesRow } from "@/shared/database/types";
import { createClient } from "@/shared/supabase/server";
import { buildNotices, getReminderInstant } from "./build-notices";
import { NOTICES_LIMIT, NOTICES_WINDOW_DAYS } from "./notice-limits";
import type { Notice } from "./types";

type SupabaseClient = ReturnType<typeof createClient>;

const DAY_MS = 24 * 60 * 60 * 1000;

// La RLS del staff solo deja ver a sus adultos mayores asignados
async function hasActiveAssignedElderly(supabase: SupabaseClient): Promise<boolean> {
  const { data, error } = await supabase
    .from("elderly")
    .select("id")
    .eq("status", "active")
    .limit(1);
  if (error) throw error;
  return data.length > 0;
}

async function shouldIncludeReminder(
  supabase: SupabaseClient,
  user: CurrentUser,
  now: Date,
): Promise<boolean> {
  if (user.role !== "staff" || !user.daily_summary_enabled) return false;
  if (now < getReminderInstant(now)) return false;
  return hasActiveAssignedElderly(supabase);
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
