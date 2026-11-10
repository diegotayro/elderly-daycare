import type { NewElderlyField, NewElderlyInput } from "./types";

export function readNewElderlyInput(formData: FormData): NewElderlyInput {
  const read = (field: NewElderlyField) => String(formData.get(field) ?? "");
  return {
    firstName: read("firstName"),
    lastName: read("lastName"),
    birthDate: read("birthDate"),
    enrolledAt: read("enrolledAt"),
    roomId: read("roomId"),
    allergies: read("allergies"),
    medicalNotes: read("medicalNotes"),
  };
}
