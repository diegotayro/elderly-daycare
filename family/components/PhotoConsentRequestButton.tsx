"use client";

import { useState } from "react";
import { Toast } from "@/shared/components/toast/Toast";

const requestToast = {
  tone: "success",
  title: "Por ahora, comunícate con la guardería para cambiarlo.",
} as const;

// Aún no envía nada: solo indica qué hacer
export function PhotoConsentRequestButton() {
  // La key reinicia el temporizador si se pulsa de nuevo con el toast abierto
  const [toastKey, setToastKey] = useState<number | null>(null);

  return (
    <>
      <button
        type="button"
        onClick={() => setToastKey((current) => (current ?? 0) + 1)}
        className="flex-none cursor-pointer rounded-full border border-line px-3 py-1.5 text-[12.5px] font-extrabold text-nav focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral-strong"
      >
        Solicitar cambio
      </button>
      {toastKey !== null && (
        <Toast
          key={toastKey}
          message={requestToast}
          onClose={() => setToastKey(null)}
        />
      )}
    </>
  );
}
