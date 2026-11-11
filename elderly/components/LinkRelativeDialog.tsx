"use client";

import { useId, useRef, useState, useTransition } from "react";
import { PlusIcon } from "@/shared/components/icons/PlusIcon";
import { Toast } from "@/shared/components/toast/Toast";
import type { ToastMessage } from "@/shared/components/toast/types";
import { createRelativeInvitation } from "../actions/create-relative-invitation";
import type {
  CreateRelativeInvitationResult,
  RelativeInvitationSent,
} from "../types";
import { LinkRelativeForm, type SendHandlers } from "./LinkRelativeForm";
import { LinkRelativeSuccess } from "./LinkRelativeSuccess";

const errorToast: ToastMessage = {
  tone: "error",
  title: "No pudimos enviar la invitación",
  description: "Intenta de nuevo en un momento.",
};

type LinkRelativeDialogProps = {
  elderlyId: string;
  elderlyFullName: string;
  elderlyFirstName: string;
  pendingInvitationEmails: string[];
};

export function LinkRelativeDialog({
  elderlyId,
  elderlyFullName,
  elderlyFirstName,
  pendingInvitationEmails,
}: LinkRelativeDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  // Cambiar la key remonta el formulario: valores por defecto y sin errores
  const [formKey, setFormKey] = useState(0);
  const [sent, setSent] = useState<RelativeInvitationSent | null>(null);
  const [isPending, startTransition] = useTransition();
  // El evento close llega después de close(): necesita saber si el envío ya terminó
  const isSendingRef = useRef(false);
  // La key reinicia el temporizador cuando un toast reemplaza a otro
  const [toast, setToast] = useState<{
    id: number;
    message: ToastMessage;
  } | null>(null);

  function showErrorToast() {
    setToast((current) => ({ id: (current?.id ?? 0) + 1, message: errorToast }));
  }

  function send(formData: FormData, handlers: SendHandlers) {
    isSendingRef.current = true;
    startTransition(async () => {
      const result = await createRelativeInvitation(
        elderlyId,
        formData,
      ).catch((): CreateRelativeInvitationResult => ({ status: "error" })); // fallo de red
      isSendingRef.current = false;

      if (result.status === "invalid") handlers.showFieldErrors(result.errors);
      else if (result.status === "needs_replace_confirmation")
        handlers.askReplaceConfirmation();
      else if (result.status === "error") showErrorToast();
      else
        setSent({
          code: result.code,
          email: result.email,
          expiresInDays: result.expiresInDays,
          emailSent: result.emailSent,
          firstName: String(formData.get("firstName") ?? "").trim(),
        });
    });
  }

  function handleDialogClose() {
    // Un segundo Esc puede cerrar el <dialog> aunque se cancele el primero
    if (isSendingRef.current) {
      dialogRef.current?.showModal();
      return;
    }
    setFormKey((key) => key + 1);
    setSent(null);
    setToast(null);
  }

  function openDialog() {
    const dialog = dialogRef.current;
    dialog?.showModal();
    dialog?.querySelector<HTMLInputElement>('[name="firstName"]')?.focus();
  }

  return (
    <>
      <button
        type="button"
        onClick={openDialog}
        className="flex cursor-pointer items-center gap-3 pt-2 text-left"
      >
        <span className="flex size-10 flex-none items-center justify-center rounded-full border-[1.5px] border-dashed border-[#D8CBBA] text-photo-ink">
          <PlusIcon size={18} strokeWidth={2.2} />
        </span>
        <span className="text-[14.5px] font-extrabold text-coral-link">
          Vincular otro familiar/tutor
        </span>
      </button>
      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        onCancel={(event) => {
          if (isSendingRef.current) event.preventDefault();
        }}
        onClose={handleDialogClose}
        className="m-0 h-dvh max-h-none w-full max-w-none overflow-hidden border-0 border-line bg-auth-bg p-0 text-ink backdrop:bg-ink/40 open:flex open:flex-col sm:mx-auto sm:mt-10 sm:mb-auto sm:h-fit sm:max-h-[calc(100dvh-80px)] sm:max-w-[480px] sm:rounded-3xl sm:border sm:shadow-[0_20px_50px_-24px_rgba(63,54,46,0.35)]"
      >
        {sent ? (
          <LinkRelativeSuccess
            titleId={titleId}
            elderlyFullName={elderlyFullName}
            sent={sent}
            onClose={() => dialogRef.current?.close()}
          />
        ) : (
          <LinkRelativeForm
            key={formKey}
            titleId={titleId}
            elderlyFullName={elderlyFullName}
            elderlyFirstName={elderlyFirstName}
            pendingInvitationEmails={pendingInvitationEmails}
            isPending={isPending}
            onClose={() => dialogRef.current?.close()}
            onSend={send}
          />
        )}
        {toast && (
          <Toast
            key={toast.id}
            message={toast.message}
            onClose={() => setToast(null)}
          />
        )}
      </dialog>
    </>
  );
}
