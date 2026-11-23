const limaTimeFormatter = new Intl.DateTimeFormat("es", {
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: "America/Lima",
});

// "14:20" en hora de Lima
export function formatLimaTime(iso: string): string {
  return limaTimeFormatter.format(new Date(iso));
}
