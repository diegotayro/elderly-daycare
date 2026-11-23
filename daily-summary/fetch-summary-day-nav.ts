import "server-only";
import { cookies } from "next/headers";
import { createClient } from "@/shared/supabase/server";
import { shiftDay } from "@/shared/date/shift-day";
import type { SummaryDayNav } from "./types";

type FetchSummaryDayNavParams = {
  elderlyId: string;
  day: string;
  today: string;
  audience: "team" | "family";
};

type Direction = "previous" | "next";

function pickClosest(
  direction: Direction,
  days: (string | null)[],
): string | null {
  const available = days.filter((day): day is string => day !== null);
  if (available.length === 0) return null;
  return direction === "previous"
    ? available.reduce((a, b) => (a > b ? a : b))
    : available.reduce((a, b) => (a < b ? a : b));
}

// Hoy y ayer se pueden completar aunque no tengan fila, así que el equipo siempre puede ir a ellos
function getWritableWindowDays(
  direction: Direction,
  day: string,
  today: string,
): string[] {
  return [shiftDay(today, -1), today].filter((candidate) =>
    direction === "previous" ? candidate < day : candidate > day,
  );
}

export async function fetchSummaryDayNav({
  elderlyId,
  day,
  today,
  audience,
}: FetchSummaryDayNavParams): Promise<SummaryDayNav> {
  const supabase = createClient(await cookies());

  async function fetchRowDay(direction: Direction): Promise<string | null> {
    const isPrevious = direction === "previous";
    let query = supabase
      .from("daily_summaries")
      .select("date")
      .eq("elderly_id", elderlyId);
    if (audience === "family") query = query.not("sent_at", "is", null);

    const { data, error } = await (
      isPrevious
        ? query.lt("date", day).order("date", { ascending: false })
        : query.gt("date", day).order("date", { ascending: true })
    )
      .limit(1)
      .maybeSingle<{ date: string }>();
    if (error) throw error;
    return data?.date ?? null;
  }

  const [previousRowDay, nextRowDay] = await Promise.all([
    fetchRowDay("previous"),
    fetchRowDay("next"),
  ]);
  const windowDays = (direction: Direction) =>
    audience === "team" ? getWritableWindowDays(direction, day, today) : [];

  return {
    previousDay: pickClosest("previous", [
      previousRowDay,
      ...windowDays("previous"),
    ]),
    nextDay: pickClosest("next", [nextRowDay, ...windowDays("next")]),
    maxDay: today,
  };
}
