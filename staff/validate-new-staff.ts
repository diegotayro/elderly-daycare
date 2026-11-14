import { NAME_MAX_LENGTH } from "@/elderly/validate-new-elderly";
import type { NewStaffErrors, NewStaffInput } from "./types";

const EMAIL_MAX_LENGTH = 254;
const BASIC_EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const messages = {
  firstNameRequired: "Escribe los nombres.",
  firstNameTooLong: `Máximo ${NAME_MAX_LENGTH} caracteres.`,
  lastNameRequired: "Escribe los apellidos.",
  lastNameTooLong: `Máximo ${NAME_MAX_LENGTH} caracteres.`,
  emailRequired: "Escribe el email.",
  emailInvalid: "Escribe un email válido.",
  confirmationRequired: "Vuelve a escribir el email.",
  confirmationMismatch: "Los emails no coinciden.",
};

// Los emails se comparan sin espacios a los extremos y sin distinguir mayúsculas
function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

// Cuenta caracteres como char_length de Postgres (no unidades UTF-16)
function textLength(value: string): number {
  return [...value.trim()].length;
}

function validateName(
  value: string,
  requiredMessage: string,
  tooLongMessage: string,
): string | undefined {
  const length = textLength(value);
  if (length === 0) return requiredMessage;
  if (length > NAME_MAX_LENGTH) return tooLongMessage;
}

function validateEmail(email: string): string | undefined {
  const normalized = normalizeEmail(email);
  if (normalized === "") return messages.emailRequired;
  if (
    normalized.length > EMAIL_MAX_LENGTH ||
    !BASIC_EMAIL_PATTERN.test(normalized)
  ) {
    return messages.emailInvalid;
  }
}

function validateConfirmation(
  email: string,
  confirmation: string,
): string | undefined {
  if (normalizeEmail(confirmation) === "") return messages.confirmationRequired;
  if (normalizeEmail(confirmation) !== normalizeEmail(email)) {
    return messages.confirmationMismatch;
  }
}

export function validateNewStaff(input: NewStaffInput): NewStaffErrors {
  const candidates: NewStaffErrors = {
    firstName: validateName(
      input.firstName,
      messages.firstNameRequired,
      messages.firstNameTooLong,
    ),
    lastName: validateName(
      input.lastName,
      messages.lastNameRequired,
      messages.lastNameTooLong,
    ),
    email: validateEmail(input.email),
    emailConfirmation: validateConfirmation(
      input.email,
      input.emailConfirmation,
    ),
  };

  return Object.fromEntries(
    Object.entries(candidates).filter(([, message]) => message !== undefined),
  );
}
