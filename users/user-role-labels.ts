import type { UserRole } from "@/shared/database/types";

export const userRoleLabels: Record<UserRole, string> = {
  staff: "Cuidador/a",
  admin: "Administrador/a",
  relative: "Familiar",
};
