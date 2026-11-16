"use client";

import { useEffect, useId, useRef, useTransition } from "react";
import type { StaffConfirmContent } from "../staff-status-messages";

type ConfirmStaffActionDialogProps = {
  content: StaffConfirmContent | null; // null: cerrado
  uncoveredElderly: string[];
  onConfirm: () => Promise<boolean>; // true: se puede cerrar el modal
  onClose: () => void;
};

export function ConfirmStaffActionDialog({
  content,
  uncoveredElderly,
  onConfirm,
  onClose,
}: ConfirmStaffActionDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const isOpen = content !== null;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (isOpen && dialog && !dialog.open) dialog.showModal();
  }, [isOpen]);

  const [isPending, startTransition] = useTransition();

  function confirm() {
    startTransition(async () => {
      if (await onConfirm()) dialogRef.current?.close();
    });
  }

  const showUncovered =
    content?.showUncoveredElderly && uncoveredElderly.length > 0;

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onClose={onClose}
      // Mientras guarda, Esc no cierra el modal
      onCancel={(event) => isPending && event.preventDefault()}
      className="m-auto w-[calc(100%-32px)] max-w-[420px] rounded-3xl border border-line bg-auth-bg p-6 text-ink backdrop:bg-ink/40 shadow-[0_20px_50px_-24px_rgba(63,54,46,0.35)]"
    >
      {content && (
        <>
          <h2
            id={titleId}
            className="m-0 mb-2 font-display text-lg leading-[normal] font-semibold text-ink"
          >
            {content.title}
          </h2>
          <p className="m-0 mb-4 text-[15px] text-muted-strong">
            {content.description}
          </p>
          {showUncovered && (
            <div className="mb-4 text-[15px] text-muted-strong">
              <p className="m-0 mb-1.5">
                Estos adultos mayores se quedarán sin cuidador/a:
              </p>
              <ul className="m-0 list-disc pl-5 font-bold text-ink">
                {uncoveredElderly.map((fullName) => (
                  <li key={fullName}>{fullName}</li>
                ))}
              </ul>
            </div>
          )}
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              autoFocus
              onClick={() => dialogRef.current?.close()}
              disabled={isPending}
              className="cursor-pointer rounded-[14px] border-[1.5px] border-line bg-surface px-[18px] py-[11px] text-[14.5px] font-bold text-nav focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral disabled:cursor-default disabled:opacity-50"
            >
              {content.dismissLabel}
            </button>
            <button
              type="button"
              onClick={confirm}
              disabled={isPending}
              className="cursor-pointer rounded-[14px] bg-[#D9684A] px-[18px] py-[11px] text-[14.5px] font-extrabold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D9684A] disabled:cursor-default disabled:opacity-50"
            >
              {isPending ? content.pendingLabel : content.confirmLabel}
            </button>
          </div>
        </>
      )}
    </dialog>
  );
}
