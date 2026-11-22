import type { ProfileChanges, ProfileField } from "./types";

// Lo que llega de una Server Action no es de fiar: solo pasan los campos permitidos y de tipo texto
export function readProfileChanges(
  raw: unknown,
  allowedFields: ProfileField[],
): ProfileChanges {
  if (typeof raw !== "object" || raw === null) return {};

  const changes: ProfileChanges = {};
  for (const field of allowedFields) {
    const value = (raw as Record<string, unknown>)[field];
    if (typeof value === "string") changes[field] = value;
  }
  return changes;
}
