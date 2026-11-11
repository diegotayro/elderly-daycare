"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { CloseIcon } from "@/shared/components/icons/CloseIcon";
import { InfoIcon } from "@/shared/components/icons/InfoIcon";
import { SendIcon } from "@/shared/components/icons/SendIcon";
import { readRelativeInvitationInput } from "../read-relative-invitation-input";
import { relativeInvitationMessages as messages } from "../relative-invitation-messages";
import type {
  RelativeInvitationErrors,
  RelativeInvitationField,
} from "../types";
import { validateRelativeInvitation } from "../validate-relative-invitation";
import { FormField, fieldControlClassName, getFieldErrorId } from "./FormField";
import { RelationshipPicker } from "./RelationshipPicker";

const FIELD_ORDER: RelativeInvitationField[] = [
  "firstName",
  "lastName",
  "email",
  "relationship",
];

const REPLACE_NOTICE_ID = "email-replace-notice";

export type SendHandlers = {
  showFieldErrors: (errors: RelativeInvitationErrors) => void;
  askReplaceConfirmation: () => void;
};

type LinkRelativeFormProps = {
  titleId: string;
  elderlyFullName: string;
  elderlyFirstName: string;
  pendingInvitationEmails: string[];
  isPending: boolean;
  onClose: () => void;
  onSend: (formData: FormData, handlers: SendHandlers) => void;
};

export function LinkRelativeForm({
  titleId,
  elderlyFullName,
  elderlyFirstName,
  pendingInvitationEmails,
  isPending,
  onClose,
  onSend,
}: LinkRelativeFormProps) {
  const [errors, setErrors] = useState<RelativeInvitationErrors>({});
  // Hay una invitación pendiente vigente y falta que el admin confirme el reemplazo
  const [needsReplaceConfirmation, setNeedsReplaceConfirmation] =
    useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  // Los campos siguen deshabilitados mientras se envía: el foco se mueve al terminar
  const mustFocusInvalidField = useRef(false);

  useEffect(() => {
    if (isPending || !mustFocusInvalidField.current) return;
    mustFocusInvalidField.current = false;
    const firstInvalidField = FIELD_ORDER.find((field) => errors[field]);
    if (firstInvalidField) {
      formRef.current
        ?.querySelector<HTMLElement>(`[name="${firstInvalidField}"]`)
        ?.focus();
    }
  }, [isPending, errors]);

  function showErrors(nextErrors: RelativeInvitationErrors) {
    mustFocusInvalidField.current = true;
    setErrors(nextErrors);
  }

  function hasPendingInvitation(email: string): boolean {
    return pendingInvitationEmails.includes(email.trim().toLowerCase());
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isPending) return;
    const formData = new FormData(event.currentTarget);
    const input = readRelativeInvitationInput(formData);
    const clientErrors = validateRelativeInvitation(input);

    if (Object.keys(clientErrors).length > 0) {
      showErrors(clientErrors);
      return;
    }
    setErrors({});

    if (!needsReplaceConfirmation && hasPendingInvitation(input.email)) {
      setNeedsReplaceConfirmation(true);
      return;
    }
    if (needsReplaceConfirmation) formData.set("replacePending", "true");
    onSend(formData, {
      showFieldErrors: showErrors,
      askReplaceConfirmation: () => setNeedsReplaceConfirmation(true),
    });
  }

  function clearFieldError(event: FormEvent<HTMLFormElement>) {
    const field = (event.target as HTMLInputElement)
      .name as RelativeInvitationField;
    setErrors((current) => ({ ...current, [field]: undefined }));
    if (field === "email") setNeedsReplaceConfirmation(false);
  }

  function controlProps(field: RelativeInvitationField) {
    return {
      id: field,
      name: field,
      "aria-invalid": errors[field] ? true : undefined,
      "aria-describedby": errors[field] ? getFieldErrorId(field) : undefined,
    };
  }

  const submitLabel = needsReplaceConfirmation
    ? "Reemplazar invitación"
    : "Enviar invitación";

  return (
    <form
      ref={formRef}
      noValidate
      onSubmit={handleSubmit}
      onChange={clearFieldError}
      className="flex min-h-0 flex-1 flex-col"
    >
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
          disabled={isPending}
          aria-label="Cerrar"
          className="flex size-[34px] cursor-pointer items-center justify-center rounded-[10px] bg-line-soft text-muted-strong disabled:cursor-default disabled:opacity-50"
        >
          <CloseIcon size={18} />
        </button>
      </header>
      <fieldset
        disabled={isPending}
        className="m-0 flex min-h-0 min-w-0 flex-col gap-[18px] overflow-y-auto border-0 px-[26px] py-[22px]"
      >
        <div className="mb-0.5 flex gap-[11px] rounded-[14px] bg-notice-bg px-4 py-[13px] text-notice-ink">
          <InfoIcon size={20} className="mt-px flex-none text-notice-icon" />
          <p className="m-0 text-[13.5px] leading-[1.45]">
            Le enviaremos un correo con un código para que active su cuenta.
            Solo verá las publicaciones de {elderlyFirstName}.
          </p>
        </div>
        <FormField id="firstName" error={errors.firstName} label="NOMBRES">
          <input
            {...controlProps("firstName")}
            placeholder="Ej. Diego"
            className={fieldControlClassName}
          />
        </FormField>
        <FormField id="lastName" error={errors.lastName} label="APELLIDOS">
          <input
            {...controlProps("lastName")}
            placeholder="Ej. Fernández Ruiz"
            className={fieldControlClassName}
          />
        </FormField>
        <div>
          <FormField id="email" error={errors.email} label="EMAIL">
            <input
              {...controlProps("email")}
              aria-describedby={
                errors.email
                  ? getFieldErrorId("email")
                  : needsReplaceConfirmation
                    ? REPLACE_NOTICE_ID
                    : undefined
              }
              type="email"
              placeholder="correo@ejemplo.com"
              className={fieldControlClassName}
            />
          </FormField>
          {needsReplaceConfirmation && (
            <p
              id={REPLACE_NOTICE_ID}
              role="status"
              className="mt-2 rounded-[12px] bg-notice-bg px-3.5 py-2.5 text-[13px] leading-[1.45] text-notice-ink"
            >
              {messages.pendingReplaceWarning}
            </p>
          )}
        </div>
        <div className="mb-0.5">
          <RelationshipPicker defaultValue="son" />
        </div>
        <button
          type="submit"
          className="flex w-full cursor-pointer items-center justify-center gap-[9px] rounded-[14px] bg-linear-to-b from-[#F4977E] to-[#EE8164] p-3.5 text-[15.5px] font-extrabold text-white shadow-[0_10px_22px_-8px_rgba(238,129,100,0.7)] disabled:cursor-default disabled:opacity-70"
        >
          <SendIcon size={19} />
          {isPending ? "Enviando…" : submitLabel}
        </button>
      </fieldset>
    </form>
  );
}
