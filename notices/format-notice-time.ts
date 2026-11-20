import { getLimaDay } from "@/shared/date/get-lima-today";
import { shiftDay } from "@/shared/date/shift-day";
import { SUMMARY_REMINDER_TIME } from "./notice-limits";

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;

const MONTH_LABELS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

const limaTimeFormatter = new Intl.DateTimeFormat("es", {
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: "America/Lima",
});

export const REMINDER_TIME_LABEL = `Hoy ${SUMMARY_REMINDER_TIME}`;

function formatOlderDate(day: string): string {
  const [, month, dayOfMonth] = day.split("-").map(Number);
  return `${dayOfMonth} ${MONTH_LABELS[month - 1]}`;
}

// Hora del aviso en hora de Lima: relativa hasta el mismo día y luego con fecha
export function formatNoticeTime(occurredAt: Date, now: Date): string {
  const elapsedMs = now.getTime() - occurredAt.getTime();

  if (elapsedMs < MINUTE_MS) return "Ahora";
  if (elapsedMs < HOUR_MS) return `Hace ${Math.floor(elapsedMs / MINUTE_MS)} min`;

  const occurredDay = getLimaDay(occurredAt);
  const today = getLimaDay(now);
  if (occurredDay === today) return `Hace ${Math.floor(elapsedMs / HOUR_MS)} h`;

  const time = limaTimeFormatter.format(occurredAt);
  if (occurredDay === shiftDay(today, -1)) return `Ayer ${time}`;

  return `${formatOlderDate(occurredDay)} ${time}`;
}
