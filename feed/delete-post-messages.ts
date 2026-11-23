import type { ConfirmDialogContent } from "@/shared/components/ConfirmDialog";
import type { ToastMessage } from "@/shared/components/toast/types";
import type { FeedNotice } from "./types";

export const DELETE_POST_LABEL = "Eliminar";

export const deletePostConfirmContent: ConfirmDialogContent = {
  title: "¿Eliminar esta publicación?",
  description:
    "También se borrarán sus fotos, reacciones y comentarios. Esta acción no se puede deshacer.",
  dismissLabel: "Cancelar",
  confirmLabel: "Eliminar",
  pendingLabel: "Eliminando…",
};

export const postHasHistoryToast: ToastMessage = {
  tone: "error",
  title: "No se puede eliminar",
  description: "Ya tiene reacciones o comentarios de otras personas.",
};

export const deletePostErrorToast: ToastMessage = {
  tone: "error",
  title: "No pudimos eliminar la publicación",
  description: "Inténtalo de nuevo.",
};

export const feedNoticeMessages: Record<FeedNotice, ToastMessage> = {
  "post-deleted": {
    tone: "success",
    title: "Publicación eliminada",
    description: "Ya no aparece en el feed.",
  },
};
