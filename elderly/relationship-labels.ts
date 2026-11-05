import type { RelationshipType } from "@/shared/database/types";

type RelationshipLabels = {
  label: string;
  activeDetail: string;
  activeBadge: string;
};

export const relationshipLabels: Record<RelationshipType, RelationshipLabels> = {
  son: { label: "Hijo", activeDetail: "activo", activeBadge: "ACTIVO" },
  daughter: { label: "Hija", activeDetail: "activa", activeBadge: "ACTIVA" },
  guardian: { label: "Tutor", activeDetail: "activo", activeBadge: "ACTIVO" },
};

export const pendingRelativeLabels = {
  detail: "invitación enviada",
  badge: "PENDIENTE",
};
