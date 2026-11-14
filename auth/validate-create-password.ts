import { createPasswordMessages as messages } from "./create-password-messages";
import type { CreatePasswordErrors, CreatePasswordInput } from "./types";
import { isValidPassword } from "./validate-password";

function validateConfirmation(
  password: string,
  confirmation: string,
): string | undefined {
  if (confirmation === "") return messages.confirmationRequired;
  if (confirmation !== password) return messages.confirmationMismatch;
}

export function validateCreatePassword(
  input: CreatePasswordInput,
): CreatePasswordErrors {
  const candidates: CreatePasswordErrors = {
    password: isValidPassword(input.password)
      ? undefined
      : messages.passwordRule,
    passwordConfirmation: validateConfirmation(
      input.password,
      input.passwordConfirmation,
    ),
  };

  return Object.fromEntries(
    Object.entries(candidates).filter(([, message]) => message !== undefined),
  );
}
