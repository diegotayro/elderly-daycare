import type { ConfirmDialogContent } from "@/shared/components/ConfirmDialog";
import type { ToastMessage } from "@/shared/components/toast/types";
import type { StaffListNotice } from "./types";

export type StaffConfirmAction = "archive" | "cancel-invitation" | "delete";

export type StaffConfirmContent = ConfirmDialogContent & {
  showUncoveredElderly: boolean;
};

export function buildStaffConfirmContent(
  action: StaffConfirmAction,
  staffFullName: string,
): StaffConfirmContent {
  switch (action) {
    case "archive":
      return {
        title: `¿Archivar a ${staffFullName}?`,
        description:
          "Ya no podrá iniciar sesión. Sus publicaciones, comentarios y reacciones se conservan. Puedes reactivarlo después.",
        showUncoveredElderly: true,
        dismissLabel: "Cancelar",
        confirmLabel: "Archivar",
        pendingLabel: "Archivando…",
      };
    case "cancel-invitation":
      return {
        title: `¿Cancelar la invitación de ${staffFullName}?`,
        description:
          "El enlace que le enviamos dejará de funcionar y se borrará de la lista. Podrás invitarlo de nuevo.",
        showUncoveredElderly: false,
        dismissLabel: "Volver",
        confirmLabel: "Cancelar invitación",
        pendingLabel: "Cancelando…",
      };
    case "delete":
      return {
        title: `¿Eliminar a ${staffFullName}?`,
        description:
          "Se borrará su cuenta y sus vínculos. Esta acción no se puede deshacer.",
        showUncoveredElderly: true,
        dismissLabel: "Cancelar",
        confirmLabel: "Eliminar",
        pendingLabel: "Eliminando…",
      };
  }
}

function errorToast(title: string): ToastMessage {
  return { tone: "error", title, description: "Inténtalo de nuevo." };
}

export const archiveErrorToast = errorToast("No pudimos archivar al staff");
export const reactivateErrorToast = errorToast("No pudimos reactivar al staff");
export const cancelInvitationErrorToast = errorToast(
  "No pudimos cancelar la invitación",
);
export const deleteErrorToast = errorToast("No pudimos eliminar al staff");

export const hasHistoryToast: ToastMessage = {
  tone: "error",
  title: "No se puede eliminar",
  description:
    "Ya tiene publicaciones, comentarios o reacciones. Puedes archivarlo.",
};

export function archivedToast(staffFullName: string): ToastMessage {
  return {
    tone: "success",
    title: "Staff archivado",
    description: `${staffFullName} ya no puede iniciar sesión.`,
  };
}

export function reactivatedToast(staffFullName: string): ToastMessage {
  return {
    tone: "success",
    title: "Staff reactivado",
    description: `${staffFullName} ya puede iniciar sesión.`,
  };
}

export const staffListNoticeMessages: Record<StaffListNotice, ToastMessage> = {
  "invitation-cancelled": {
    tone: "success",
    title: "Invitación cancelada",
    description: "Ya no aparece en la lista.",
  },
  "staff-deleted": {
    tone: "success",
    title: "Staff eliminado",
    description: "Ya no aparece en la lista.",
  },
};
