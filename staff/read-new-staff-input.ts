import type { NewStaffField, NewStaffInput } from "./types";

export function readNewStaffInput(formData: FormData): NewStaffInput {
  const read = (field: NewStaffField) => String(formData.get(field) ?? "");
  return {
    firstName: read("firstName"),
    lastName: read("lastName"),
    email: read("email"),
    emailConfirmation: read("emailConfirmation"),
  };
}
