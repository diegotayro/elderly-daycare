"use client";

import { useId, useRef, useState, useTransition } from "react";
import { PlusIcon } from "@/shared/components/icons/PlusIcon";
import { Toast } from "@/shared/components/toast/Toast";
import type { ToastMessage } from "@/shared/components/toast/types";
import { createElderly } from "../actions/create-elderly";
import type {
  CreateElderlyResult,
  NewElderlyErrors,
  RoomOption,
} from "../types";
import { AddElderlyForm } from "./AddElderlyForm";

const errorToast: ToastMessage = {
  tone: "error",
  title: "No pudimos guardar",
  description: "Intenta de nuevo en un momento.",
};

function successToast(fullName: string): ToastMessage {
  return {
    tone: "success",
    title: "Adulto mayor agregado",
    description: `${fullName} ya está en la lista.`,
  };
}

type AddElderlyDialogProps = {
  rooms: RoomOption[];
  today: string;
};

export function AddElderlyDialog({ rooms, today }: AddElderlyDialogProps) {
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
    showFieldErrors: (errors: NewElderlyErrors) => void,
  ) {
    isSavingRef.current = true;
    startTransition(async () => {
      const result = await createElderly(formData).catch(
        (): CreateElderlyResult => ({ status: "error" }), // fallo de red
      );
      isSavingRef.current = false;
      if (result.status === "invalid") {
        showFieldErrors(result.errors);
      } else if (result.status === "error") {
        showToast(errorToast);
      } else {
        dialogRef.current?.close();
        showToast(successToast(result.fullName));
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
      <button
        type="button"
        onClick={openDialog}
        className="flex cursor-pointer items-center gap-2 whitespace-nowrap rounded-[14px] bg-linear-to-b from-[#F4977E] to-[#EE8164] px-[18px] py-[11px] text-[14.5px] font-extrabold text-white shadow-[0_8px_18px_-8px_rgba(238,129,100,0.7)]"
      >
        <PlusIcon size={17} />
        Agregar adulto mayor
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
        <AddElderlyForm
          key={formKey}
          rooms={rooms}
          today={today}
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
