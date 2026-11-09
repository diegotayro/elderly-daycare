const LIMA_TIME_ZONE = "America/Lima";

// El locale "en-CA" formatea la fecha como "aaaa-mm-dd"
const limaDateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: LIMA_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

// "aaaa-mm-dd" de hoy en Lima (en UTC puede ser otro día durante la noche)
export function getLimaToday(): string {
  return limaDateFormatter.format(new Date());
}
