"use client";

import { useId, useRef, useState } from "react";
import { PlusIcon } from "@/shared/components/icons/PlusIcon";
import { LinkRelativeForm } from "./LinkRelativeForm";

type LinkRelativeDialogProps = {
  elderlyFullName: string;
  elderlyFirstName: string;
  pendingInvitationEmails: string[];
};

export function LinkRelativeDialog({
  elderlyFullName,
  elderlyFirstName,
  pendingInvitationEmails,
}: LinkRelativeDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  // Cambiar la key remonta el formulario: valores por defecto y sin errores
  const [formKey, setFormKey] = useState(0);

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
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
        onClose={() => setFormKey((key) => key + 1)}
        className="m-0 h-dvh max-h-none w-full max-w-none overflow-hidden border-0 border-line bg-auth-bg p-0 text-ink backdrop:bg-ink/40 open:flex open:flex-col sm:mx-auto sm:mt-10 sm:mb-auto sm:h-fit sm:max-h-[calc(100dvh-80px)] sm:max-w-[480px] sm:rounded-3xl sm:border sm:shadow-[0_20px_50px_-24px_rgba(63,54,46,0.35)]"
      >
        <LinkRelativeForm
          key={formKey}
          titleId={titleId}
          elderlyFullName={elderlyFullName}
          elderlyFirstName={elderlyFirstName}
          pendingInvitationEmails={pendingInvitationEmails}
          onClose={() => dialogRef.current?.close()}
        />
      </dialog>
    </>
  );
}
