const longDayFormatter = new Intl.DateTimeFormat("es", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "UTC",
});

// day es "aaaa-mm-dd": "martes 17 de junio"
export function formatLongDay(day: string): string {
  const [year, month, dayOfMonth] = day.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, dayOfMonth));
  return longDayFormatter.format(date).replace(",", "");
}
