"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Toast } from "./Toast";
import type { ToastMessage } from "./types";

type UrlNoticeToastProps = {
  message: ToastMessage | null; // null: no hay aviso
  clearHref: string; // "/staff" | "/"
};

// Muestra una vez el aviso que llega por la URL (?notice=...) y limpia el parámetro
export function UrlNoticeToast({ message, clearHref }: UrlNoticeToastProps) {
  const router = useRouter();
  // El mensaje se guarda en estado: al limpiar la URL, `message` pasa a null
  const [visibleMessage, setVisibleMessage] = useState(message);

  useEffect(() => {
    if (message) router.replace(clearHref);
  }, [message, clearHref, router]);

  if (!visibleMessage) return null;
  return (
    <Toast message={visibleMessage} onClose={() => setVisibleMessage(null)} />
  );
}
