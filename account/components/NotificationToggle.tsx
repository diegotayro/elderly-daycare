"use client";

import { useOptimistic, useState, useTransition } from "react";
import { SwitchTrack } from "@/shared/components/SwitchTrack";
import { Toast } from "@/shared/components/toast/Toast";
import { accountMessages } from "../account-messages";
import { updateNotificationPreference } from "../actions/update-notification-preference";
import type { NotificationPreferenceKey } from "../notification-preferences";

type NotificationToggleProps = {
  userId: string;
  preferenceKey: NotificationPreferenceKey;
  label: string;
  initialEnabled: boolean;
};

// Sin red la Server Action lanza en vez de devolver "error": se trata igual
async function trySavePreference(
  userId: string,
  key: NotificationPreferenceKey,
  value: boolean,
): Promise<boolean> {
  try {
    const result = await updateNotificationPreference(userId, key, value);
    return result.status === "ok";
  } catch {
    return false;
  }
}

export function NotificationToggle({
  userId,
  preferenceKey,
  label,
  initialEnabled,
}: NotificationToggleProps) {
  const [confirmed, setConfirmed] = useState(initialEnabled);
  // Mientras guarda se ve el valor nuevo; si falla, vuelve al confirmado
  const [enabled, showOptimistic] = useOptimistic(confirmed);
  const [isPending, startTransition] = useTransition();
  // La key reinicia el temporizador cuando un toast reemplaza a otro
  const [toastKey, setToastKey] = useState<number | null>(null);

  function toggle() {
    if (isPending) return;
    const next = !enabled;

    startTransition(async () => {
      showOptimistic(next);
      if (await trySavePreference(userId, preferenceKey, next)) {
        setConfirmed(next);
      } else {
        setToastKey((current) => (current ?? 0) + 1);
      }
    });
  }

  return (
    <>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        onClick={toggle}
        className="flex w-full cursor-pointer items-center justify-between gap-4 border-b border-line-soft py-2 text-left last:border-b-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral-strong"
      >
        <span className="text-[15px] text-body">{label}</span>
        <SwitchTrack enabled={enabled} />
      </button>
      {toastKey !== null && (
        <Toast
          key={toastKey}
          message={accountMessages.preferenceSaveErrorToast}
          onClose={() => setToastKey(null)}
        />
      )}
    </>
  );
}
