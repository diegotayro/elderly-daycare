import { shiftDay } from "@/shared/date/shift-day";

export type DayLabelAudience = "team" | "family";

const WEEKDAYS = [
  "DOMINGO",
  "LUNES",
  "MARTES",
  "MIÉRCOLES",
  "JUEVES",
  "VIERNES",
  "SÁBADO",
];
const MONTHS = [
  "ENE",
  "FEB",
  "MAR",
  "ABR",
  "MAY",
  "JUN",
  "JUL",
  "AGO",
  "SEP",
  "OCT",
  "NOV",
  "DIC",
];

function parseDay(day: string): Date {
  const [year, month, dayOfMonth] = day.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, dayOfMonth));
}

function formatWeekdayAndDate(day: string): string {
  const date = parseDay(day);
  return `${WEEKDAYS[date.getUTCDay()]} ${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]}`;
}

// day y today son "aaaa-mm-dd" en hora de Lima
export function buildDayLabel(
  day: string,
  today: string,
  audience: DayLabelAudience,
): string {
  const isToday = day === today;
  const isYesterday = day === shiftDay(today, -1);

  if (audience === "team") {
    if (isToday) return "PUBLICADO HOY";
    if (isYesterday) return "AYER";
    return formatWeekdayAndDate(day);
  }

  if (isToday) return `HOY · ${formatWeekdayAndDate(day)}`;
  if (isYesterday) return `AYER · ${formatWeekdayAndDate(day)}`;
  return formatWeekdayAndDate(day);
}
