"use client";

import { useOptimistic, useState, useTransition } from "react";
import { SwitchTrack } from "@/shared/components/SwitchTrack";
import { Toast } from "@/shared/components/toast/Toast";
import type { ToastMessage } from "@/shared/components/toast/types";
import { updatePhotoConsent } from "../actions/update-photo-consent";
import { photoConsentLabel } from "../photo-consent-labels";
import { photoConsentMessages } from "../photo-consent-messages";

type PhotoConsentToggleProps = {
  elderlyId: string;
  initialAllowed: boolean;
};

// Sin red la Server Action lanza en vez de devolver "error": se trata igual
async function trySaveConsent(
  elderlyId: string,
  value: boolean,
): Promise<boolean> {
  try {
    const result = await updatePhotoConsent(elderlyId, value);
    return result.status === "ok";
  } catch {
    return false;
  }
}

export function PhotoConsentToggle({
  elderlyId,
  initialAllowed,
}: PhotoConsentToggleProps) {
  const [confirmed, setConfirmed] = useState(initialAllowed);
  // Mientras guarda se ve el valor nuevo; si falla, vuelve al confirmado
  const [allowed, showOptimistic] = useOptimistic(confirmed);
  const [isPending, startTransition] = useTransition();
  // La key reinicia el temporizador cuando un toast reemplaza a otro
  const [toast, setToast] = useState<{
    key: number;
    message: ToastMessage;
  } | null>(null);

  function toggle() {
    if (isPending) return;
    const next = !allowed;

    startTransition(async () => {
      showOptimistic(next);
      const saved = await trySaveConsent(elderlyId, next);
      if (saved) setConfirmed(next);
      const message = saved
        ? photoConsentMessages.savedToast
        : photoConsentMessages.saveErrorToast;
      setToast((current) => ({ key: (current?.key ?? 0) + 1, message }));
    });
  }

  return (
    <>
      <button
        type="button"
        role="switch"
        aria-checked={allowed}
        aria-label="Fotos"
        onClick={toggle}
        className="flex cursor-pointer items-center gap-3 rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral-strong"
      >
        <span>{photoConsentLabel(allowed)}</span>
        <SwitchTrack enabled={allowed} />
      </button>
      {toast && (
        <Toast
          key={toast.key}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
}
