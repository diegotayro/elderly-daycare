"use client";

import { CloseIcon } from "@/shared/components/icons/CloseIcon";
import { InfoIcon } from "@/shared/components/icons/InfoIcon";
import { SendIcon } from "@/shared/components/icons/SendIcon";
import { FormField, fieldControlClassName } from "./FormField";
import { InvitationCodePreview } from "./InvitationCodePreview";
import { RelationshipPicker } from "./RelationshipPicker";

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
  elderlyFirstName,
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
      <div className="flex min-h-0 flex-col gap-[18px] overflow-y-auto px-[26px] py-[22px]">
        <div className="flex gap-[11px] rounded-[14px] bg-notice-bg px-4 py-[13px] text-notice-ink">
          <InfoIcon size={20} className="mt-px flex-none text-notice-icon" />
          <p className="m-0 text-[13.5px] leading-[1.45]">
            Le enviaremos un correo con un código para que active su cuenta.
            Solo verá las publicaciones de {elderlyFirstName}.
          </p>
        </div>
        <FormField id="firstName" label="NOMBRES">
          <input
            id="firstName"
            name="firstName"
            placeholder="Ej. Diego"
            className={fieldControlClassName}
          />
        </FormField>
        <FormField id="lastName" label="APELLIDOS">
          <input
            id="lastName"
            name="lastName"
            placeholder="Ej. Fernández Ruiz"
            className={fieldControlClassName}
          />
        </FormField>
        <FormField id="email" label="EMAIL">
          <input
            id="email"
            name="email"
            type="email"
            placeholder="correo@ejemplo.com"
            className={fieldControlClassName}
          />
        </FormField>
        <RelationshipPicker defaultValue="son" />
        <InvitationCodePreview />
        <button
          type="submit"
          className="flex w-full cursor-pointer items-center justify-center gap-[9px] rounded-[14px] bg-linear-to-b from-[#F4977E] to-[#EE8164] p-3.5 text-[15.5px] font-extrabold text-white shadow-[0_10px_22px_-8px_rgba(238,129,100,0.7)]"
        >
          <SendIcon size={19} />
          Enviar invitación
        </button>
      </div>
    </form>
  );
}
