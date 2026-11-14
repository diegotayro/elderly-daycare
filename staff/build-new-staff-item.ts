import type { AvatarTone } from "@/elderly/avatar-tones";
import { formatLinkedElderlyCount } from "./staff-formatters";
import type { NewStaffInput, StaffListItem } from "./types";

// Tarjeta de un staff recién agregado desde el modal (estado local del mock)
export function buildNewStaffItem(
  input: NewStaffInput,
  id: string,
  tone: AvatarTone,
): StaffListItem {
  const firstName = input.firstName.trim();
  return {
    id,
    fullName: `${firstName} ${input.lastName.trim()}`,
    initial: firstName[0],
    tone,
    summary: formatLinkedElderlyCount(0),
    indicator: { kind: "link" },
    isLink: false,
  };
}
