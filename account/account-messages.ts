import type { ToastMessage } from "@/shared/components/toast/types";

export const accountMessages = {
  preferenceSaveErrorToast: {
    tone: "error",
    title: "No se pudo guardar el cambio",
    description: "Intenta de nuevo.",
  } satisfies ToastMessage,
} as const;
