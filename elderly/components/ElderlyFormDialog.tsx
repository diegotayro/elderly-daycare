"use client";

import { useId, useRef, useState, useTransition, type ReactNode } from "react";
import { formDialogClassName } from "@/shared/components/form-dialog-class-name";
import { Toast } from "@/shared/components/toast/Toast";
import type { ToastMessage } from "@/shared/components/toast/types";
import type {
  ElderlyFormErrors,
  ElderlyFormValues,
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
  initialValues?: ElderlyFormValues;
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
  initialValues,
  trigger,
  action,
  getSuccessToast,
}: ElderlyFormDialogProps<TResult>) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  // Cambiar la key remonta el formulario: valores por defecto y sin errores.
  // También se remonta si cambian los valores iniciales (llegan con refresh() tras guardar).
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
        className={formDialogClassName}
      >
        <ElderlyForm
          key={`${formKey}-${JSON.stringify(initialValues)}`}
          rooms={rooms}
          today={today}
          title={title}
          initialValues={initialValues}
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
