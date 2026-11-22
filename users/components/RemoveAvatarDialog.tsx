"use client";

import { useEffect, useId, useRef, useTransition } from "react";
import { avatarMessages } from "../avatar-messages";

type RemoveAvatarDialogProps = {
  isOpen: boolean;
  onConfirm: () => Promise<boolean>; // true: se puede cerrar el diálogo
  onClose: () => void;
};

const { removeDialog } = avatarMessages;

export function RemoveAvatarDialog({
  isOpen,
  onConfirm,
  onClose,
}: RemoveAvatarDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (isOpen && dialog && !dialog.open) dialog.showModal();
  }, [isOpen]);

  function confirm() {
    startTransition(async () => {
      if (await onConfirm()) dialogRef.current?.close();
    });
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onClose={onClose}
      // Mientras quita la foto, Esc no cierra el diálogo
      onCancel={(event) => isPending && event.preventDefault()}
      className="m-auto w-[calc(100%-32px)] max-w-[420px] rounded-3xl border border-line bg-auth-bg p-6 text-ink backdrop:bg-ink/40 shadow-[0_20px_50px_-24px_rgba(63,54,46,0.35)]"
    >
      {isOpen && (
        <>
          <h2
            id={titleId}
            className="m-0 mb-2 font-display text-lg leading-[normal] font-semibold text-ink"
          >
            {removeDialog.title}
          </h2>
          <p className="m-0 text-[15px] text-muted-strong">
            {removeDialog.description}
          </p>
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              autoFocus
              onClick={() => dialogRef.current?.close()}
              disabled={isPending}
              className="cursor-pointer rounded-[14px] border-[1.5px] border-line bg-surface px-[18px] py-[11px] text-[14.5px] font-bold text-nav focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral disabled:cursor-default disabled:opacity-50"
            >
              {removeDialog.dismissLabel}
            </button>
            <button
              type="button"
              onClick={confirm}
              disabled={isPending}
              className="cursor-pointer rounded-[14px] bg-[#D9684A] px-[18px] py-[11px] text-[14.5px] font-extrabold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D9684A] disabled:cursor-default disabled:opacity-50"
            >
              {isPending ? removeDialog.pendingLabel : removeDialog.confirmLabel}
            </button>
          </div>
        </>
      )}
    </dialog>
  );
}
