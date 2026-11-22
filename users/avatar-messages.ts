import type { ToastMessage } from "@/shared/components/toast/types";

const uploadErrorToast: ToastMessage = {
  tone: "error",
  title: "No se pudo cambiar la foto",
  description: "Intenta de nuevo.",
};

const unprocessableToast: ToastMessage = {
  tone: "error",
  title: "No se pudo procesar la imagen",
  description: "Prueba con otra foto.",
};

const removeErrorToast: ToastMessage = {
  tone: "error",
  title: "No se pudo quitar la foto",
  description: "Intenta de nuevo.",
};

export const avatarMessages = {
  changeButton: "Cambiar foto",
  removeButton: "Quitar foto",
  viewPhotoLabel: (fullName: string) => `Ver foto de ${fullName}`,
  removeDialog: {
    title: "¿Quitar la foto?",
    description: "Se volverán a mostrar las iniciales.",
    dismissLabel: "Cancelar",
    confirmLabel: "Quitar",
    pendingLabel: "Quitando…",
  },
  uploadErrorToast,
  unprocessableToast,
  removeErrorToast,
} as const;
