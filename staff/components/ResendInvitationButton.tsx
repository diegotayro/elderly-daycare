"use client";

import { useState, useTransition } from "react";
import { Toast } from "@/shared/components/toast/Toast";
import type { ToastMessage } from "@/shared/components/toast/types";
import { resendStaffInvitation } from "../actions/resend-staff-invitation";
import type { StaffActionResult } from "../types";

const errorToast: ToastMessage = {
  tone: "error",
  title: "No pudimos reenviar la invitación",
  description: "Inténtalo de nuevo.",
};

function successToast(email: string): ToastMessage {
  return {
    tone: "success",
    title: "Invitación reenviada",
    description: `Enviamos un nuevo enlace a ${email}.`,
  };
}

type ResendInvitationButtonProps = {
  staffId: string;
  email: string;
};

export function ResendInvitationButton({
  staffId,
  email,
}: ResendInvitationButtonProps) {
  const [isPending, startTransition] = useTransition();
  // La key reinicia el temporizador cuando un toast reemplaza a otro
  const [toast, setToast] = useState<{
    id: number;
    message: ToastMessage;
  } | null>(null);

  function resend() {
    startTransition(async () => {
      const result = await resendStaffInvitation(staffId).catch(
        (): StaffActionResult => ({ status: "error" }), // fallo de red
      );
      const message =
        result.status === "success" ? successToast(email) : errorToast;
      setToast((current) => ({ id: (current?.id ?? 0) + 1, message }));
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={resend}
        disabled={isPending}
        className="cursor-pointer rounded-xl border-[1.5px] border-line bg-surface px-4 py-[9px] text-sm font-bold text-nav focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral disabled:cursor-default disabled:opacity-50"
      >
        {isPending ? "Reenviando…" : "Reenviar invitación"}
      </button>
      {toast && (
        <Toast
          key={toast.id}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
}
