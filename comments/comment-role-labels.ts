import type { UserRole } from "@/shared/database/types";

export const commentRoleLabels: Record<UserRole, string> = {
  relative: "familiar",
  staff: "cuidador/a",
  admin: "administración",
};
