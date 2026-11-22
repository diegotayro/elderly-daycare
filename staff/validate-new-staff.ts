import {
  validateEmailConfirmation,
  validateProfileChanges,
  validateProfileEmail,
} from "@/account/validate-profile";
import type { NewStaffErrors, NewStaffInput } from "./types";

export function validateNewStaff(input: NewStaffInput): NewStaffErrors {
  const candidates: NewStaffErrors = {
    ...validateProfileChanges({
      firstName: input.firstName,
      lastName: input.lastName,
    }),
    email: validateProfileEmail(input.email),
    emailConfirmation: validateEmailConfirmation(
      input.email,
      input.emailConfirmation,
    ),
  };

  return Object.fromEntries(
    Object.entries(candidates).filter(([, message]) => message !== undefined),
  );
}
