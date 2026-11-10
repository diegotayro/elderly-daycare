import { newElderlyMessages as messages } from "./new-elderly-messages";
import { parseAllergyTags } from "./parse-allergy-tags";
import type { NewElderlyErrors, NewElderlyInput } from "./types";

type ValidationRules = {
  today: string; // ISO "aaaa-mm-dd"
  roomIds: string[];
};

export const NAME_MAX_LENGTH = 80;
export const MEDICAL_NOTES_MAX_LENGTH = 2000;
const ALLERGIES_MAX_COUNT = 15;
const ALLERGY_MAX_LENGTH = 40;

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

function validateAllergies(text: string): string | undefined {
  const tags = parseAllergyTags(text);
  if (tags.length > ALLERGIES_MAX_COUNT) return messages.allergiesTooMany;
  if (tags.some((tag) => textLength(tag) > ALLERGY_MAX_LENGTH)) {
    return messages.allergyTooLong;
  }
}

function validateMedicalNotes(text: string): string | undefined {
  if (textLength(text) > MEDICAL_NOTES_MAX_LENGTH) {
    return messages.medicalNotesTooLong;
  }
}

function validateBirthDate(
  birthDate: string,
  today: string,
): string | undefined {
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
    birthDate: validateBirthDate(input.birthDate, rules.today),
    enrolledAt: validateEnrolledAt(input.enrolledAt, input.birthDate),
    roomId: rules.roomIds.includes(input.roomId)
      ? undefined
      : messages.roomRequired,
    allergies: validateAllergies(input.allergies),
    medicalNotes: validateMedicalNotes(input.medicalNotes),
  };

  return Object.fromEntries(
    Object.entries(candidates).filter(([, message]) => message !== undefined),
  );
}
