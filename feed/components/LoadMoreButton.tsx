"use client";

import { useState, useTransition } from "react";
import { Toast } from "@/shared/components/toast/Toast";
import type { ToastMessage } from "@/shared/components/toast/types";
import { newPostMessages as messages } from "../new-post-messages";

const errorToast: ToastMessage = {
  tone: "error",
  title: messages.loadMoreErrorTitle,
  description: messages.loadMoreErrorDescription,
};

type LoadMoreButtonProps = {
  // Devuelve false si no se pudo cargar
  onLoad: () => Promise<boolean>;
};

export function LoadMoreButton({ onLoad }: LoadMoreButtonProps) {
  const [isPending, startTransition] = useTransition();
  // La key reinicia el temporizador cuando un toast reemplaza a otro
  const [toastId, setToastId] = useState<number | null>(null);

  function load() {
    startTransition(async () => {
      const loaded = await onLoad().catch(() => false); // fallo de red
      if (!loaded) setToastId((current) => (current ?? 0) + 1);
    });
  }

  return (
    <>
      <div className="flex justify-center">
        <button
          type="button"
          onClick={load}
          disabled={isPending}
          className="w-full cursor-pointer rounded-xl border-[1.5px] border-line bg-surface px-4 py-[9px] text-sm font-bold text-nav focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral disabled:cursor-default disabled:opacity-50 sm:w-auto"
        >
          {isPending ? "Cargando…" : "Cargar días anteriores"}
        </button>
      </div>
      {toastId !== null && (
        <Toast
          key={toastId}
          message={errorToast}
          onClose={() => setToastId(null)}
        />
      )}
    </>
  );
}
