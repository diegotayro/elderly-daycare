import { NAME_MAX_LENGTH } from "@/elderly/validate-new-elderly";
import type { ProfileErrors } from "./types";

type NameValues = { firstName?: string; lastName?: string };

const messages = {
  firstNameRequired: "Escribe los nombres.",
  lastNameRequired: "Escribe los apellidos.",
  nameTooLong: `Máximo ${NAME_MAX_LENGTH} caracteres.`,
};

// Cuenta caracteres como char_length de Postgres (no unidades UTF-16)
function textLength(value: string): number {
  return [...value.trim()].length;
}

function validateName(
  value: string,
  requiredMessage: string,
): string | undefined {
  const length = textLength(value);
  if (length === 0) return requiredMessage;
  if (length > NAME_MAX_LENGTH) return messages.nameTooLong;
}

// Valida solo los campos presentes: "Editar" envía únicamente lo que cambió
export function validateProfileNames({
  firstName,
  lastName,
}: NameValues): ProfileErrors {
  const candidates: ProfileErrors = {
    firstName:
      firstName === undefined
        ? undefined
        : validateName(firstName, messages.firstNameRequired),
    lastName:
      lastName === undefined
        ? undefined
        : validateName(lastName, messages.lastNameRequired),
  };

  return Object.fromEntries(
    Object.entries(candidates).filter(([, message]) => message !== undefined),
  );
}
