"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Toast } from "@/shared/components/toast/Toast";
import type { ToastMessage } from "@/shared/components/toast/types";
import type { StaffListNotice } from "../types";

const noticeMessages: Record<StaffListNotice, ToastMessage> = {
  "invitation-cancelled": {
    tone: "success",
    title: "Invitación cancelada",
    description: "Ya no aparece en la lista.",
  },
  "staff-deleted": {
    tone: "success",
    title: "Staff eliminado",
    description: "Ya no aparece en la lista.",
  },
};

type StaffListNoticeToastProps = {
  notice: StaffListNotice | null;
};

export function StaffListNoticeToast({ notice }: StaffListNoticeToastProps) {
  const router = useRouter();
  // El mensaje se guarda en estado: al limpiar la URL, `notice` pasa a null
  const [message, setMessage] = useState<ToastMessage | null>(
    notice && noticeMessages[notice],
  );

  // El parámetro solo sirve para mostrar el aviso una vez
  useEffect(() => {
    if (notice) router.replace("/staff");
  }, [notice, router]);

  if (!message) return null;
  return <Toast message={message} onClose={() => setMessage(null)} />;
}
