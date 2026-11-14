"use client";

import { useEffect, useId, useRef } from "react";
import type { LinkedElderly } from "../types";

type UnlinkElderlyDialogProps = {
  elderly: LinkedElderly | null; // null: cerrado
  staffFullName: string;
  onConfirm: (elderly: LinkedElderly) => void;
  onClose: () => void;
};

export function UnlinkElderlyDialog({
  elderly,
  staffFullName,
  onConfirm,
  onClose,
}: UnlinkElderlyDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    if (elderly) dialogRef.current?.showModal();
  }, [elderly]);

  function confirm() {
    if (!elderly) return;
    dialogRef.current?.close();
    onConfirm(elderly);
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onClose={onClose}
      className="m-auto w-[calc(100%-32px)] max-w-[420px] rounded-3xl border border-line bg-auth-bg p-6 text-ink backdrop:bg-ink/40 shadow-[0_20px_50px_-24px_rgba(63,54,46,0.35)]"
    >
      {elderly && (
        <>
          <h2
            id={titleId}
            className="m-0 mb-2 font-display text-lg leading-[normal] font-semibold text-ink"
          >
            ¿Desvincular a {elderly.fullName}?
          </h2>
          <p className="m-0 mb-6 text-[15px] text-muted-strong">
            {staffFullName} dejará de ver sus publicaciones. Puedes volver a
            vincularlo después.
          </p>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              autoFocus
              onClick={() => dialogRef.current?.close()}
              className="cursor-pointer rounded-[14px] border-[1.5px] border-line bg-surface px-[18px] py-[11px] text-[14.5px] font-bold text-nav focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={confirm}
              className="cursor-pointer rounded-[14px] bg-[#D9684A] px-[18px] py-[11px] text-[14.5px] font-extrabold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D9684A]"
            >
              Desvincular
            </button>
          </div>
        </>
      )}
    </dialog>
  );
}
