import type { ToastMessage } from "@/shared/components/toast/types";
import type { ProfileField } from "./types";

const preferenceSaveErrorToast: ToastMessage = {
  tone: "error",
  title: "No se pudo guardar el cambio",
  description: "Intenta de nuevo.",
};

const profileSaveErrorToast: ToastMessage = {
  tone: "error",
  title: "No se pudieron guardar los cambios",
  description: "Intenta de nuevo.",
};

export const profileFieldLabels: Record<ProfileField, string> = {
  firstName: "Nombres",
  lastName: "Apellidos",
  email: "Email",
};

export const accountMessages = {
  preferenceSaveErrorToast,
  profileSaveErrorToast,
  profileSaveError: "No se pudieron guardar los cambios. Intenta de nuevo.",
  emailInUse: "Ese email ya está en uso.",
  changesSummary: (fieldLabels: string[]) =>
    `Cambiará: ${fieldLabels.join(", ")}`,
} as const;
