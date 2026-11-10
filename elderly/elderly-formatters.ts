const dateFormatter = (options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("es", { timeZone: "UTC", ...options });

const birthDateFormatter = dateFormatter({
  day: "numeric",
  month: "short",
  year: "numeric",
});
const enrolledAtFormatter = dateFormatter({ month: "short", year: "numeric" });

// Intl puede agregar un punto al mes corto ("mar.") según el runtime.
function removeMonthDot(formatted: string): string {
  return formatted.replace(".", "");
}

export function calculateAge(birthDate: string, referenceDate: string): number {
  const [birthYear, birthMonth, birthDay] = birthDate.split("-").map(Number);
  const [refYear, refMonth, refDay] = referenceDate.split("-").map(Number);
  const hadBirthday =
    refMonth > birthMonth || (refMonth === birthMonth && refDay >= birthDay);
  return refYear - birthYear - (hadBirthday ? 0 : 1);
}

export function formatAge(birthDate: string, referenceDate: string): string {
  return `${calculateAge(birthDate, referenceDate)} años`;
}

export function formatBirthDate(birthDate: string): string {
  return removeMonthDot(birthDateFormatter.format(new Date(birthDate)));
}

export function formatEnrolledAt(enrolledAt: string): string {
  return removeMonthDot(enrolledAtFormatter.format(new Date(enrolledAt)));
}

export function formatRelativesCount(count: number): string {
  if (count === 0) return "sin familiares vinculados";
  if (count === 1) return "1 familiar vinculado";
  return `${count} familiares vinculados`;
}

export function formatAllergies(tags: string[]): string | null {
  if (tags.length === 0) return null;
  const label = tags.length === 1 ? "Alergia" : "Alergias";
  return `${label}: ${tags.join(", ")}.`;
}
