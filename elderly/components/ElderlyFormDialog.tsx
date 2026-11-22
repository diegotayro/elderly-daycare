"use client";

import { useId, useRef, useState, useTransition, type ReactNode } from "react";
import { Toast } from "@/shared/components/toast/Toast";
import type { ToastMessage } from "@/shared/components/toast/types";
import type {
  ElderlyFormErrors,
  ElderlySaveResult,
  RoomOption,
} from "../types";
import { ElderlyForm } from "./ElderlyForm";

const errorToast: ToastMessage = {
  tone: "error",
  title: "No pudimos guardar",
  description: "Intenta de nuevo en un momento.",
};

type ElderlyFormDialogProps<TResult extends ElderlySaveResult> = {
  title: string;
  rooms: RoomOption[];
  today: string;
  trigger: ReactNode; // el botón que abre el modal
  action: (formData: FormData) => Promise<TResult>;
  getSuccessToast: (
    result: Extract<TResult, { status: "success" }>,
  ) => ToastMessage;
};

export function ElderlyFormDialog<TResult extends ElderlySaveResult>({
  title,
  rooms,
  today,
  trigger,
  action,
  getSuccessToast,
}: ElderlyFormDialogProps<TResult>) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  // Cambiar la key remonta el formulario: valores por defecto y sin errores
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
    formData: FormData,
    showFieldErrors: (errors: ElderlyFormErrors) => void,
  ) {
    isSavingRef.current = true;
    startTransition(async () => {
      const result = await action(formData).catch(
        (): ElderlySaveResult => ({ status: "error" }), // fallo de red
      );
      isSavingRef.current = false;
      if (result.status === "invalid") {
        showFieldErrors(result.errors);
      } else if (result.status === "error") {
        showToast(errorToast);
      } else {
        dialogRef.current?.close();
        showToast(
          getSuccessToast(result as Extract<TResult, { status: "success" }>),
        );
      }
    });
  }

  function handleDialogClose() {
    const dialog = dialogRef.current;
    // Un segundo Esc puede cerrar el <dialog> aunque se cancele el primero
    if (isSavingRef.current) {
      dialog?.showModal();
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
      <span className="contents" onClick={openDialog}>
        {trigger}
      </span>
      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        onCancel={(event) => {
          if (isSavingRef.current) event.preventDefault();
        }}
        onClose={handleDialogClose}
        className="m-0 h-dvh max-h-none w-full max-w-none overflow-hidden border-0 border-line bg-auth-bg p-0 text-ink backdrop:bg-ink/40 open:flex open:flex-col sm:mx-auto sm:mt-10 sm:mb-auto sm:h-fit sm:max-h-[calc(100dvh-80px)] sm:max-w-[520px] sm:rounded-3xl sm:border sm:shadow-[0_20px_50px_-24px_rgba(63,54,46,0.35)]"
      >
        <ElderlyForm
          key={formKey}
          rooms={rooms}
          today={today}
          title={title}
          titleId={titleId}
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
