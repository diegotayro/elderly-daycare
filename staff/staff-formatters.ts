import type { UserStatus } from "@/shared/database/types";
import type { StaffProfile } from "./types";

export function formatLinkedElderlyCount(count: number): string {
  if (count === 0) return "Sin adultos mayores vinculados";
  if (count === 1) return "1 adulto mayor vinculado";
  return `${count} adultos mayores vinculados`;
}

const statusLabels: Record<UserStatus, StaffProfile["statusLabel"]> = {
  active: "Activo",
  pending: "Pendiente",
  archived: "Archivado",
};

export function formatStaffStatus(
  status: UserStatus,
): StaffProfile["statusLabel"] {
  return statusLabels[status];
}
