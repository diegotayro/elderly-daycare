import type { StaffListNotice } from "./types";

const staffListNotices: StaffListNotice[] = [
  "invitation-cancelled",
  "staff-deleted",
];

// Cualquier otro valor del parámetro se ignora
export function readStaffListNotice(
  notice: string | string[] | undefined,
): StaffListNotice | null {
  return staffListNotices.find((item) => item === notice) ?? null;
}
