"use server";

import { refresh } from "next/cache";
import { cookies } from "next/headers";
import { getCurrentUser } from "@/auth/get-current-user";
import { getLimaToday } from "@/shared/date/get-lima-today";
import { shiftDay } from "@/shared/date/shift-day";
import { createClient } from "@/shared/supabase/server";
import { isUuid } from "@/shared/text/is-uuid";
import { dailySummaryMessages as messages } from "../daily-summary-messages";
import { parseSummaryDate } from "../parse-summary-date";
import type { DailySummaryInput, SaveDailySummaryResult } from "../types";
import {
  toSleepMinutes,
  validateDailySummary,
  type SummaryIntent,
} from "../validate-daily-summary";

const MAX_FIELD_LENGTH = 200;

function parseInput(raw: unknown): DailySummaryInput | null {
  if (typeof raw !== "object" || raw === null) return null;
  const { mood, sleepHours, sleepMinutes } = raw as Record<string, unknown>;
  const fields = [mood, sleepHours, sleepMinutes];
  const areValid = fields.every(
    (field) => typeof field === "string" && field.length <= MAX_FIELD_LENGTH,
  );
  if (!areValid) return null;
  return { mood, sleepHours, sleepMinutes } as DailySummaryInput;
}

function getSuccessMessage(intent: SummaryIntent, wasSent: boolean): string {
  if (intent === "draft") return messages.draftSaved;
  return wasSent ? messages.changesSaved : messages.sent;
}

// Solo el equipo escribe; la RLS decide el permiso por adulto mayor y la ventana de hoy y ayer
export async function saveDailySummary(
  elderlyId: string,
  date: string,
  rawInput: unknown,
  intent: SummaryIntent,
): Promise<SaveDailySummaryResult> {
  const input = parseInput(rawInput);
  const today = getLimaToday();
  const isWritableDate =
    typeof date === "string" &&
    parseSummaryDate(date, today) !== null &&
    date >= shiftDay(today, -1);
  const isValidIntent = intent === "draft" || intent === "send";
  if (
    typeof elderlyId !== "string" ||
    !isUuid(elderlyId) ||
    !isWritableDate ||
    !isValidIntent ||
    !input
  ) {
    return { status: "error" };
  }

  const caller = await getCurrentUser();
  if (!caller || caller.role === "relative") return { status: "error" };

  const supabase = createClient(await cookies());
  const { data: existing, error: readError } = await supabase
    .from("daily_summaries")
    .select("sent_at")
    .eq("elderly_id", elderlyId)
    .eq("date", date)
    .maybeSingle<{ sent_at: string | null }>();
  if (readError) {
    console.error("saveDailySummary: no se pudo leer el resumen", readError);
    return { status: "error" };
  }

  // Un resumen enviado no vuelve a borrador: guardarlo exige los mismos datos que enviarlo
  const wasSent = existing?.sent_at != null;
  const effectiveIntent: SummaryIntent = wasSent ? "send" : intent;
  const errors = validateDailySummary(input, effectiveIntent);
  if (Object.keys(errors).length > 0) return { status: "invalid", errors };

  const sentAt =
    existing?.sent_at ??
    (effectiveIntent === "send" ? new Date().toISOString() : null);
  const { data, error } = await supabase
    .from("daily_summaries")
    .upsert(
      {
        elderly_id: elderlyId,
        date,
        mood: input.mood.trim() || null,
        sleep_minutes: toSleepMinutes(input),
        sent_at: sentAt,
      },
      { onConflict: "elderly_id,date" },
    )
    .select("id");
  // La RLS rechaza con error o devuelve 0 filas
  if (error || !data || data.length === 0) {
    console.error("saveDailySummary: no se pudo guardar", error);
    return { status: "error" };
  }

  refresh();
  return {
    status: "success",
    message: getSuccessMessage(effectiveIntent, wasSent),
  };
}
