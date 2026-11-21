import { getLimaDay } from "./get-lima-today";
import { MONTH_LABELS } from "./month-labels";
import { shiftDay } from "./shift-day";

const limaTimeFormatter = new Intl.DateTimeFormat("es", {
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: "America/Lima",
});

function formatShortDate(day: string): string {
  const [, month, dayOfMonth] = day.split("-").map(Number);
  return `${dayOfMonth} ${MONTH_LABELS[month - 1]}`;
}

// today es "aaaa-mm-dd" en Lima. Hoy: "10:02"; ayer: "Ayer 10:02"; antes: "17 nov 10:02"
export function formatRelativeTime(iso: string, today: string): string {
  const instant = new Date(iso);
  const day = getLimaDay(instant);
  const time = limaTimeFormatter.format(instant);

  if (day === today) return time;
  if (day === shiftDay(today, -1)) return `Ayer ${time}`;
  return `${formatShortDate(day)} ${time}`;
}
