"use client";

import { CloseIcon } from "@/shared/components/icons/CloseIcon";

type LinkRelativeFormProps = {
  titleId: string;
  elderlyFullName: string;
  elderlyFirstName: string;
  pendingInvitationEmails: string[];
  onClose: () => void;
};

export function LinkRelativeForm({
  titleId,
  elderlyFullName,
  onClose,
}: LinkRelativeFormProps) {
  return (
    <form noValidate className="flex min-h-0 flex-1 flex-col">
      <header className="flex shrink-0 items-center justify-between border-b border-line px-[26px] py-5">
        <div>
          <h2
            id={titleId}
            className="m-0 font-display text-lg leading-[normal] font-semibold text-ink"
          >
            Vincular familiar/tutor
          </h2>
          <p className="m-0 text-[13px] text-muted">a {elderlyFullName}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="flex size-[34px] cursor-pointer items-center justify-center rounded-[10px] bg-line-soft text-muted-strong"
        >
          <CloseIcon size={18} />
        </button>
      </header>
    </form>
  );
}
