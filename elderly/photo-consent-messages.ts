import type { ToastMessage } from "@/shared/components/toast/types";

export const photoConsentMessages = {
  savedToast: {
    tone: "success",
    title: "Consentimiento de fotos actualizado.",
  },
  saveErrorToast: {
    tone: "error",
    title: "No se pudo guardar el consentimiento de fotos. Intenta de nuevo.",
  },
} as const satisfies Record<string, ToastMessage>;
