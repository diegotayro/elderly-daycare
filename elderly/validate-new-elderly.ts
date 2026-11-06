import { newElderlyMessages as messages } from "./new-elderly-messages";
import type { NewElderlyErrors, NewElderlyInput } from "./types";

type ValidationRules = {
  today: string; // ISO "aaaa-mm-dd"
  roomIds: string[];
};

function isBlank(value: string): boolean {
  return value.trim() === "";
}

function validateBirthDate(birthDate: string, today: string): string | undefined {
  if (birthDate === "") return messages.birthDateRequired;
  if (birthDate > today) return messages.birthDateInFuture;
}

function validateEnrolledAt(
  enrolledAt: string,
  birthDate: string,
): string | undefined {
  if (enrolledAt === "") return messages.enrolledAtRequired;
  if (birthDate !== "" && enrolledAt <= birthDate) {
    return messages.enrolledAtBeforeBirth;
  }
}

export function validateNewElderly(
  input: NewElderlyInput,
  rules: ValidationRules,
): NewElderlyErrors {
  const candidates: NewElderlyErrors = {
    firstName: isBlank(input.firstName) ? messages.firstNameRequired : undefined,
    lastName: isBlank(input.lastName) ? messages.lastNameRequired : undefined,
    birthDate: validateBirthDate(input.birthDate, rules.today),
    enrolledAt: validateEnrolledAt(input.enrolledAt, input.birthDate),
    roomId: rules.roomIds.includes(input.roomId)
      ? undefined
      : messages.roomRequired,
  };

  return Object.fromEntries(
    Object.entries(candidates).filter(([, message]) => message !== undefined),
  );
}
