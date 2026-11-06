import { relationshipLabels } from "./relationship-labels";
import { relativeInvitationMessages as messages } from "./relative-invitation-messages";
import type {
  RelativeInvitationErrors,
  RelativeInvitationInput,
} from "./types";

type ValidationRules = {
  pendingEmails: string[];
};

const BASIC_EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isBlank(value: string): boolean {
  return value.trim() === "";
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function validateEmail(
  email: string,
  pendingEmails: string[],
): string | undefined {
  if (isBlank(email)) return messages.emailRequired;
  if (!BASIC_EMAIL_PATTERN.test(email.trim())) return messages.emailInvalid;
  const isPending = pendingEmails.some(
    (pending) => normalizeEmail(pending) === normalizeEmail(email),
  );
  if (isPending) return messages.emailAlreadyPending;
}

export function validateRelativeInvitation(
  input: RelativeInvitationInput,
  rules: ValidationRules,
): RelativeInvitationErrors {
  const candidates: RelativeInvitationErrors = {
    firstName: isBlank(input.firstName) ? messages.firstNameRequired : undefined,
    lastName: isBlank(input.lastName) ? messages.lastNameRequired : undefined,
    email: validateEmail(input.email, rules.pendingEmails),
    relationship: Object.hasOwn(relationshipLabels, input.relationship)
      ? undefined
      : messages.relationshipRequired,
  };

  return Object.fromEntries(
    Object.entries(candidates).filter(([, message]) => message !== undefined),
  );
}
