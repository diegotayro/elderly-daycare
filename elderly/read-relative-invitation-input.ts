import type {
  RelativeInvitationField,
  RelativeInvitationInput,
} from "./types";

export function readRelativeInvitationInput(
  formData: FormData,
): RelativeInvitationInput {
  const read = (field: RelativeInvitationField) =>
    String(formData.get(field) ?? "");
  return {
    firstName: read("firstName"),
    lastName: read("lastName"),
    email: read("email"),
    relationship: read("relationship"),
  };
}
