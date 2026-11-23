"use client";

import {
  useImperativeHandle,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { SkeletonBlock } from "@/shared/components/SkeletonBlock";
import { Toast } from "@/shared/components/toast/Toast";
import type { ToastMessage } from "@/shared/components/toast/types";

export type PostFormDialogHandle = {
  open: () => void;
  close: () => void;
  showToast: (message: ToastMessage) => void;
};

type PostFormDialogProps = {
  handleRef: RefObject<PostFormDialogHandle | null>;
  titleId: string;
  // Mientras es true, Esc y "Cancelar" no cierran el modal
  busyRef: RefObject<boolean>;
  // Se llama cuando el modal se cerró de verdad: el padre reinicia el formulario
  onClosed: () => void;
  children: ReactNode;
};

export function PostFormSkeleton() {
  return (
    <div aria-busy="true" className="flex flex-col gap-6 px-[26px] py-6">
      <SkeletonBlock className="h-6 w-1/2 rounded-full" />
      <SkeletonBlock className="h-24 rounded-2xl" />
      <SkeletonBlock className="h-12 rounded-2xl" />
      <SkeletonBlock className="h-32 rounded-2xl" />
    </div>
  );
}

// <dialog> compartido por "Nueva publicación" y "Editar publicación": toasts y bloqueo de Esc
export function PostFormDialog({
  handleRef,
  titleId,
  busyRef,
  onClosed,
  children,
}: PostFormDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  // La key reinicia el temporizador cuando un toast reemplaza a otro
  // inDialog: el toast se mostró con el modal abierto y se va con él al cerrarlo
  const [toast, setToast] = useState<{
    id: number;
    message: ToastMessage;
    inDialog: boolean;
  } | null>(null);

  useImperativeHandle(handleRef, () => ({
    open() {
      const dialog = dialogRef.current;
      dialog?.showModal();
      dialog?.querySelector<HTMLElement>("[data-audience-chip]")?.focus();
    },
    close() {
      dialogRef.current?.close();
    },
    showToast(message) {
      const inDialog = dialogRef.current?.open ?? false;
      setToast((current) => ({
        id: (current?.id ?? 0) + 1,
        message,
        inDialog,
      }));
    },
  }));

  function closeToast() {
    setToast(null);
  }

  function handleDialogClose() {
    // El evento close llega después de close(): un segundo Esc puede cerrar el <dialog>
    // aunque se cancele el primero
    if (busyRef.current) {
      dialogRef.current?.showModal();
      return;
    }
    onClosed();
    // El toast que vive dentro del <dialog> se va con él
    setToast((current) => (current?.inDialog ? null : current));
  }

  return (
    <>
      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        onCancel={(event) => {
          if (busyRef.current) event.preventDefault();
        }}
        onClose={handleDialogClose}
        className="m-0 h-dvh max-h-none w-full max-w-none overflow-hidden border-0 border-line bg-auth-bg p-0 text-ink backdrop:bg-ink/40 open:flex open:flex-col sm:mx-auto sm:mt-10 sm:mb-auto sm:h-fit sm:max-h-[calc(100dvh-80px)] sm:max-w-[580px] sm:rounded-3xl sm:border sm:shadow-[0_20px_50px_-24px_rgba(63,54,46,0.35)]"
      >
        {children}
        {toast?.inDialog && (
          <Toast key={toast.id} message={toast.message} onClose={closeToast} />
        )}
      </dialog>
      {toast && !toast.inDialog && (
        <Toast key={toast.id} message={toast.message} onClose={closeToast} />
      )}
    </>
  );
}
