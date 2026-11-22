import { NAME_MAX_LENGTH } from "@/elderly/validate-elderly-form";
import { normalizeProfileValue } from "./diff-profile-changes";
import type { ProfileChanges, ProfileErrors } from "./types";

const EMAIL_MAX_LENGTH = 254;
const BASIC_EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const messages = {
  firstNameRequired: "Escribe los nombres.",
  lastNameRequired: "Escribe los apellidos.",
  nameTooLong: `Máximo ${NAME_MAX_LENGTH} caracteres.`,
  emailRequired: "Escribe el email.",
  emailInvalid: "Escribe un email válido.",
  confirmationRequired: "Vuelve a escribir el email.",
  confirmationMismatch: "Los emails no coinciden.",
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

export function validateProfileEmail(email: string): string | undefined {
  const normalized = normalizeProfileValue("email", email);
  if (normalized === "") return messages.emailRequired;
  if (
    normalized.length > EMAIL_MAX_LENGTH ||
    !BASIC_EMAIL_PATTERN.test(normalized)
  ) {
    return messages.emailInvalid;
  }
}

// Los emails se comparan sin espacios a los extremos y sin distinguir mayúsculas
export function validateEmailConfirmation(
  email: string,
  confirmation: string,
): string | undefined {
  const normalizedConfirmation = normalizeProfileValue("email", confirmation);
  if (normalizedConfirmation === "") return messages.confirmationRequired;
  if (normalizedConfirmation !== normalizeProfileValue("email", email)) {
    return messages.confirmationMismatch;
  }
}

function withoutEmptyMessages(candidates: ProfileErrors): ProfileErrors {
  return Object.fromEntries(
    Object.entries(candidates).filter(([, message]) => message !== undefined),
  );
}

// Valida solo los campos presentes: "Editar" envía únicamente lo que cambió
export function validateProfileChanges({
  firstName,
  lastName,
  email,
}: ProfileChanges): ProfileErrors {
  return withoutEmptyMessages({
    firstName:
      firstName === undefined
        ? undefined
        : validateName(firstName, messages.firstNameRequired),
    lastName:
      lastName === undefined
        ? undefined
        : validateName(lastName, messages.lastNameRequired),
    email: email === undefined ? undefined : validateProfileEmail(email),
  });
}
