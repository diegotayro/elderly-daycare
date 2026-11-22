import type { ConfirmDialogContent } from "@/shared/components/ConfirmDialog";
import type { ToastMessage } from "@/shared/components/toast/types";

export function buildArchiveConfirmContent(
  fullName: string,
): ConfirmDialogContent {
  return {
    title: `¿Archivar a ${fullName}?`,
    description:
      "Ya no aparecerá en Activos ni se podrá etiquetar en publicaciones nuevas. Se cancelarán sus invitaciones pendientes. Sus publicaciones se conservan y puedes reactivarlo después.",
    dismissLabel: "Cancelar",
    confirmLabel: "Archivar",
    pendingLabel: "Archivando…",
  };
}

function errorToast(title: string): ToastMessage {
  return { tone: "error", title, description: "Inténtalo de nuevo." };
}

export const archiveErrorToast = errorToast(
  "No pudimos archivar al adulto mayor",
);
export const reactivateErrorToast = errorToast(
  "No pudimos reactivar al adulto mayor",
);

export function archivedToast(fullName: string): ToastMessage {
  return {
    tone: "success",
    title: "Adulto mayor archivado",
    description: `${fullName} ya no aparece en Activos.`,
  };
}

export function reactivatedToast(fullName: string): ToastMessage {
  return {
    tone: "success",
    title: "Adulto mayor reactivado",
    description: `${fullName} vuelve a aparecer en Activos.`,
  };
}
