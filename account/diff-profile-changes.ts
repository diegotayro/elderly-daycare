import type { ProfileChanges, ProfileField } from "./types";

type ProfileValues = Partial<Record<ProfileField, string>>;

const PROFILE_FIELDS: ProfileField[] = ["firstName", "lastName", "email"];

// Nombres y apellidos sin espacios a los extremos; el email, además, en minúsculas
export function normalizeProfileValue(
  field: ProfileField,
  value: string,
): string {
  const trimmed = value.trim();
  return field === "email" ? trimmed.toLowerCase() : trimmed;
}

// Devuelve solo los campos de `current` cuyo valor normalizado difiere del inicial.
// Lo usan el modal (para habilitar "Guardar") y las Server Actions (sin confiar en el cliente).
export function diffProfileChanges(
  initial: ProfileValues,
  current: ProfileValues,
): ProfileChanges {
  const changes: ProfileChanges = {};
  for (const field of PROFILE_FIELDS) {
    const currentValue = current[field];
    if (currentValue === undefined) continue;

    const normalized = normalizeProfileValue(field, currentValue);
    const initialNormalized = normalizeProfileValue(field, initial[field] ?? "");
    if (normalized !== initialNormalized) changes[field] = normalized;
  }
  return changes;
}
