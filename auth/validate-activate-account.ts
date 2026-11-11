import { activateAccountMessages as messages } from "./activate-account-messages";
import type { ActivateAccountErrors, ActivateAccountInput } from "./types";
import { isValidPassword } from "./validate-password";

const CODE_PATTERN = /^[A-Z0-9]{5}$/;
const BASIC_EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeInvitationCode(code: string): string {
  return code.replace(/\s/g, "").toUpperCase();
}

export function validateActivateAccount(
  input: ActivateAccountInput,
): ActivateAccountErrors {
  const candidates: ActivateAccountErrors = {
    code: CODE_PATTERN.test(normalizeInvitationCode(input.code))
      ? undefined
      : messages.codeFormat,
    email: BASIC_EMAIL_PATTERN.test(input.email.trim())
      ? undefined
      : messages.emailInvalid,
    password: isValidPassword(input.password)
      ? undefined
      : messages.passwordRule,
  };

  return Object.fromEntries(
    Object.entries(candidates).filter(([, message]) => message !== undefined),
  );
}
