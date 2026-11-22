"use client";

import { useId, useRef, useState, useTransition } from "react";
import { accountMessages } from "@/account/account-messages";
import type {
  ActionResult,
  ProfileChanges,
  ProfileErrors,
} from "@/account/types";
import { Toast } from "@/shared/components/toast/Toast";
import type { ToastMessage } from "@/shared/components/toast/types";
import { EditUserForm, type EditUserValues } from "./EditUserForm";

type EditUserDialogProps = {
  title: string; // "Editar perfil" | "Editar staff" | "Editar familiar"
  initialValues: EditUserValues;
  successDescription: string; // segunda línea del toast "Cambios guardados"
  // Server Action ya enlazada al usuario que se edita
  onSave: (changes: ProfileChanges) => Promise<ActionResult<ProfileErrors>>;
};

export function EditUserDialog({
  title,
  initialValues,
  successDescription,
  onSave,
}: EditUserDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  // Cambiar la key remonta el formulario: valores iniciales y sin errores
  const [formKey, setFormKey] = useState(0);
  const [isPending, startTransition] = useTransition();
  // El evento close llega después de close(): necesita saber si el guardado ya terminó
  const isSavingRef = useRef(false);
  // La key reinicia el temporizador cuando un toast reemplaza a otro
  const [toast, setToast] = useState<{
    id: number;
    message: ToastMessage;
  } | null>(null);

  function showToast(message: ToastMessage) {
    setToast((current) => ({ id: (current?.id ?? 0) + 1, message }));
  }

  function closeToast() {
    setToast(null);
  }

  function save(
    changes: ProfileChanges,
    showFieldErrors: (errors: ProfileErrors) => void,
  ) {
    isSavingRef.current = true;
    startTransition(async () => {
      const result = await onSave(changes).catch(
        (): ActionResult<ProfileErrors> => ({
          status: "error",
          message: accountMessages.profileSaveError, // fallo de red
        }),
      );
      isSavingRef.current = false;
      if (result.status === "invalid") {
        showFieldErrors(result.errors);
      } else if (result.status === "error") {
        showToast(accountMessages.profileSaveErrorToast);
      } else {
        dialogRef.current?.close();
        showToast({
          tone: "success",
          title: "Cambios guardados",
          description: successDescription,
        });
      }
    });
  }

  function handleDialogClose() {
    // Un segundo Esc puede cerrar el <dialog> aunque se cancele el primero
    if (isSavingRef.current) {
      dialogRef.current?.showModal();
      return;
    }
    setFormKey((key) => key + 1);
    // El toast de error vive dentro del <dialog>: se va con él
    setToast((current) => (current?.message.tone === "error" ? null : current));
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
        className="cursor-pointer rounded-xl border-[1.5px] border-line bg-white px-4 py-[9px] text-sm font-bold text-nav focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral-strong"
      >
        Editar
      </button>
      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        onCancel={(event) => {
          if (isSavingRef.current) event.preventDefault();
        }}
        onClose={handleDialogClose}
        className="m-0 h-dvh max-h-none w-full max-w-none overflow-hidden border-0 border-line bg-auth-bg p-0 text-ink backdrop:bg-ink/40 open:flex open:flex-col sm:mx-auto sm:mt-10 sm:mb-auto sm:h-fit sm:max-h-[calc(100dvh-80px)] sm:max-w-[520px] sm:rounded-3xl sm:border sm:shadow-[0_20px_50px_-24px_rgba(63,54,46,0.35)]"
      >
        <EditUserForm
          key={`${formKey}:${initialValues.firstName}:${initialValues.lastName}:${initialValues.email}`}
          titleId={titleId}
          title={title}
          initialValues={initialValues}
          isPending={isPending}
          onCancel={() => dialogRef.current?.close()}
          onSave={save}
        />
        {toast?.message.tone === "error" && (
          <Toast key={toast.id} message={toast.message} onClose={closeToast} />
        )}
      </dialog>
      {toast?.message.tone === "success" && (
        <Toast key={toast.id} message={toast.message} onClose={closeToast} />
      )}
    </>
  );
}
