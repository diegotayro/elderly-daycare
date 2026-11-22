import { validateProfileNames } from "@/account/validate-profile";
import type { NewStaffErrors, NewStaffInput } from "./types";

const EMAIL_MAX_LENGTH = 254;
const BASIC_EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const messages = {
  emailRequired: "Escribe el email.",
  emailInvalid: "Escribe un email válido.",
  confirmationRequired: "Vuelve a escribir el email.",
  confirmationMismatch: "Los emails no coinciden.",
};

// Los emails se comparan sin espacios a los extremos y sin distinguir mayúsculas
function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
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
    ...validateProfileNames(input),
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
