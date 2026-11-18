// day es "aaaa-mm-dd"; offset en días (negativo = antes)
export function shiftDay(day: string, offset: number): string {
  const [year, month, dayOfMonth] = day.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, dayOfMonth + offset));
  return date.toISOString().slice(0, 10);
}
