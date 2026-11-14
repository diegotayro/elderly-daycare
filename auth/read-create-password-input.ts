import type { CreatePasswordField, CreatePasswordInput } from "./types";

export function readCreatePasswordInput(
  formData: FormData,
): CreatePasswordInput {
  const read = (field: CreatePasswordField) =>
    String(formData.get(field) ?? "");
  return {
    password: read("password"),
    passwordConfirmation: read("passwordConfirmation"),
  };
}
