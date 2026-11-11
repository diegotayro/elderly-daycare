import { AlertIcon } from "@/shared/components/icons/AlertIcon";
import { CheckIcon } from "@/shared/components/icons/CheckIcon";
import { CloseIcon } from "@/shared/components/icons/CloseIcon";
import type { RelativeInvitationSent } from "../types";
import { InvitationCodePreview } from "./InvitationCodePreview";

type LinkRelativeSuccessProps = {
  titleId: string;
  elderlyFullName: string;
  sent: RelativeInvitationSent;
  onClose: () => void;
};

export function LinkRelativeSuccess({
  titleId,
  elderlyFullName,
  sent,
  onClose,
}: LinkRelativeSuccessProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
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
      <div className="flex min-h-0 flex-col gap-[18px] overflow-y-auto px-[26px] py-[22px]">
        <div
          role="status"
          className="flex items-center gap-[11px] rounded-[14px] bg-notice-bg px-4 py-[13px] text-notice-ink"
        >
          <span className="flex size-6 flex-none items-center justify-center rounded-full bg-consent-check text-white">
            <CheckIcon size={14} />
          </span>
          <p className="m-0 min-w-0 text-[13.5px] leading-[1.45] [overflow-wrap:anywhere]">
            Invitación enviada a <strong>{sent.email}</strong>
          </p>
        </div>
        {!sent.emailSent && (
          <div
            role="alert"
            className="flex gap-[11px] rounded-[14px] border border-logout-line bg-logout-bg px-4 py-[13px] text-error"
          >
            <AlertIcon size={20} className="mt-px flex-none" />
            <p className="m-0 text-[13.5px] leading-[1.45]">
              No pudimos enviar el correo. Comparte este código con{" "}
              {sent.firstName}.
            </p>
          </div>
        )}
        <InvitationCodePreview
          code={sent.code}
          expiresInDays={sent.expiresInDays}
        />
        <button
          type="button"
          onClick={onClose}
          className="flex w-full cursor-pointer items-center justify-center rounded-[14px] bg-linear-to-b from-[#F4977E] to-[#EE8164] p-3.5 text-[15.5px] font-extrabold text-white shadow-[0_10px_22px_-8px_rgba(238,129,100,0.7)]"
        >
          Listo
        </button>
      </div>
    </div>
  );
}
