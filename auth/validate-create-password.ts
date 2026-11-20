import type { CreatePasswordErrors, CreatePasswordInput } from "./types";
import {
  isValidPassword,
  passwordMessages,
  validatePasswordConfirmation,
} from "./validate-password";

export function validateCreatePassword(
  input: CreatePasswordInput,
): CreatePasswordErrors {
  const candidates: CreatePasswordErrors = {
    password: isValidPassword(input.password)
      ? undefined
      : passwordMessages.rule,
    passwordConfirmation: validatePasswordConfirmation(
      input.password,
      input.passwordConfirmation,
    ),
  };

  return Object.fromEntries(
    Object.entries(candidates).filter(([, message]) => message !== undefined),
  );
}
