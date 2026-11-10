"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
import { AlertIcon } from "@/shared/components/icons/AlertIcon";
import { CheckIcon } from "@/shared/components/icons/CheckIcon";
import { CloseIcon } from "@/shared/components/icons/CloseIcon";
import type { ToastMessage, ToastTone } from "./types";

const AUTO_CLOSE_MS: Record<ToastTone, number> = {
  success: 5000,
  error: 8000,
};

const TONE_STYLES: Record<ToastTone, { iconClassName: string; role: string }> =
  {
    success: { iconClassName: "bg-consent-check", role: "status" },
    error: { iconClassName: "bg-error", role: "alert" },
  };

type ToastProps = {
  message: ToastMessage;
  onClose: () => void;
};

// Para reemplazar un toast por otro, el padre cambia la `key` y el temporizador reinicia.
export function Toast({ message, onClose }: ToastProps) {
  const { tone, title, description } = message;
  const [isHovered, setIsHovered] = useState(false);
  const [hasFocus, setHasFocus] = useState(false);
  const isPaused = isHovered || hasFocus;

  const remainingMs = useRef(AUTO_CLOSE_MS[tone]);
  const close = useEffectEvent(onClose);

  useEffect(() => {
    if (isPaused) return;
    const startedAt = Date.now();
    const timeoutId = setTimeout(close, remainingMs.current);
    return () => {
      clearTimeout(timeoutId);
      remainingMs.current -= Date.now() - startedAt;
    };
  }, [isPaused]);

  const Icon = tone === "success" ? CheckIcon : AlertIcon;

  return (
    <div
      role={TONE_STYLES[tone].role}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setHasFocus(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setHasFocus(false);
        }
      }}
      className="fixed inset-x-4 bottom-4 z-50 flex items-start gap-3 rounded-2xl border border-line bg-surface p-4 shadow-[0_8px_24px_rgba(63,54,46,0.14)] transition-[opacity,translate] duration-200 ease-out starting:translate-y-3 starting:opacity-0 motion-reduce:transition-none sm:right-6 sm:bottom-6 sm:left-auto sm:w-full sm:max-w-[360px]"
    >
      <span
        className={`flex size-8 shrink-0 items-center justify-center rounded-full text-white ${TONE_STYLES[tone].iconClassName}`}
      >
        <Icon size={16} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="m-0 text-[15px] font-extrabold text-ink">{title}</p>
        <p className="m-0 mt-0.5 text-[13.5px] text-muted-strong">
          {description}
        </p>
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Cerrar aviso"
        className="flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-full text-muted-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral-strong"
      >
        <CloseIcon size={14} />
      </button>
    </div>
  );
}
