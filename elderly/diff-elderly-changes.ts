import { parseAllergyTags } from "./parse-allergy-tags";
import type { ElderlyFormField, ElderlyFormValues } from "./types";

const FIELD_ORDER: ElderlyFormField[] = [
  "firstName",
  "lastName",
  "birthDate",
  "enrolledAt",
  "roomId",
  "allergies",
  "medicalNotes",
];

// Alergias como lista (el orden y las mayúsculas cuentan); el resto, sin espacios a los extremos
function normalizeValue(field: ElderlyFormField, value: string): string {
  if (field === "allergies") return JSON.stringify(parseAllergyTags(value));
  return value.trim();
}

// Devuelve los campos cuyo valor normalizado difiere del inicial.
// Lo usan el modal (habilitar "Guardar" y la línea de resumen) y la Server Action (sin confiar en el cliente).
export function diffElderlyChanges(
  initial: ElderlyFormValues,
  current: ElderlyFormValues,
): ElderlyFormField[] {
  return FIELD_ORDER.filter(
    (field) =>
      normalizeValue(field, current[field]) !==
      normalizeValue(field, initial[field]),
  );
}
