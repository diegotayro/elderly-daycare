import type { ElderlyFormField, ElderlyFormValues } from "./types";

export function readElderlyFormValues(formData: FormData): ElderlyFormValues {
  const read = (field: ElderlyFormField) => String(formData.get(field) ?? "");
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
