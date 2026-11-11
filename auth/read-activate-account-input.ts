import type { ActivateAccountInput } from "./types";

export function readActivateAccountInput(
  formData: FormData,
): ActivateAccountInput {
  const read = (field: string) => String(formData.get(field) ?? "");
  return {
    code: read("code"),
    email: read("email"),
    password: read("password"),
    photoConsent: formData.get("photoConsent") === "on",
  };
}
