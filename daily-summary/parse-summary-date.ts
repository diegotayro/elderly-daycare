const DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function isRealDay(day: string): boolean {
  const date = new Date(`${day}T00:00:00Z`);
  return (
    !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === day
  );
}

// Devuelve el día de ?date= si es una fecha real que no es futura; si no, null
export function parseSummaryDate(
  raw: string | string[] | undefined,
  today: string,
): string | null {
  if (typeof raw !== "string" || !DAY_PATTERN.test(raw)) return null;
  if (!isRealDay(raw) || raw > today) return null;
  return raw;
}
