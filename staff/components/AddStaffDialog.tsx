"use client";

import { useId, useRef, useState } from "react";
import { PlusIcon } from "@/shared/components/icons/PlusIcon";
import { Toast } from "@/shared/components/toast/Toast";
import type { ToastMessage } from "@/shared/components/toast/types";
import type { NewStaffInput } from "../types";
import { AddStaffForm } from "./AddStaffForm";

function successToast(fullName: string): ToastMessage {
  return {
    tone: "success",
    title: "Staff agregado",
    description: `${fullName} ya está en la lista.`,
  };
}

type AddStaffDialogProps = {
  existingEmails: string[];
  onAdd: (input: NewStaffInput) => void;
};

export function AddStaffDialog({ existingEmails, onAdd }: AddStaffDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  // Cambiar la key remonta el formulario: vacío y sin errores
  const [formKey, setFormKey] = useState(0);
  // La key reinicia el temporizador cuando un toast reemplaza a otro
  const [toast, setToast] = useState<{
    id: number;
    message: ToastMessage;
  } | null>(null);

  function openDialog() {
    const dialog = dialogRef.current;
    dialog?.showModal();
    dialog?.querySelector<HTMLInputElement>('[name="firstName"]')?.focus();
  }

  function save(input: NewStaffInput) {
    onAdd(input);
    dialogRef.current?.close();
    setToast((current) => ({
      id: (current?.id ?? 0) + 1,
      message: successToast(
        `${input.firstName.trim()} ${input.lastName.trim()}`,
      ),
    }));
  }

  return (
    <>
      <button
        type="button"
        onClick={openDialog}
        className="flex cursor-pointer items-center gap-2 whitespace-nowrap rounded-[14px] bg-linear-to-b from-[#F4977E] to-[#EE8164] px-[18px] py-[11px] text-[14.5px] font-extrabold text-white shadow-[0_8px_18px_-8px_rgba(238,129,100,0.7)]"
      >
        <PlusIcon size={17} />
        Agregar staff
      </button>
      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        onClose={() => setFormKey((key) => key + 1)}
        className="m-0 h-dvh max-h-none w-full max-w-none overflow-hidden border-0 border-line bg-auth-bg p-0 text-ink backdrop:bg-ink/40 open:flex open:flex-col sm:mx-auto sm:mt-10 sm:mb-auto sm:h-fit sm:max-h-[calc(100dvh-80px)] sm:max-w-[520px] sm:rounded-3xl sm:border sm:shadow-[0_20px_50px_-24px_rgba(63,54,46,0.35)]"
      >
        <AddStaffForm
          key={formKey}
          titleId={titleId}
          existingEmails={existingEmails}
          onCancel={() => dialogRef.current?.close()}
          onSave={save}
        />
      </dialog>
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
