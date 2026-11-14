"use client";

import { useRef, useState, type FormEvent } from "react";
import {
  FormField,
  fieldControlClassName,
  getFieldErrorId,
} from "@/elderly/components/FormField";
import { NAME_MAX_LENGTH } from "@/elderly/validate-new-elderly";
import { readNewStaffInput } from "../read-new-staff-input";
import { validateNewStaff } from "../validate-new-staff";
import type { NewStaffErrors, NewStaffField, NewStaffInput } from "../types";

const FIELD_ORDER: NewStaffField[] = [
  "firstName",
  "lastName",
  "email",
  "emailConfirmation",
];
const CONFIRMATION_HELP_ID = "emailConfirmation-help";

type AddStaffFormProps = {
  titleId: string;
  existingEmails: string[];
  onCancel: () => void;
  onSave: (input: NewStaffInput) => void;
};

export function AddStaffForm({
  titleId,
  existingEmails,
  onCancel,
  onSave,
}: AddStaffFormProps) {
  const [errors, setErrors] = useState<NewStaffErrors>({});
  const formRef = useRef<HTMLFormElement>(null);

  function focusField(field: NewStaffField) {
    formRef.current?.querySelector<HTMLElement>(`[name="${field}"]`)?.focus();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input = readNewStaffInput(new FormData(event.currentTarget));
    const nextErrors = validateNewStaff(input, { existingEmails });
    setErrors(nextErrors);

    const firstInvalidField = FIELD_ORDER.find((field) => nextErrors[field]);
    if (firstInvalidField) {
      focusField(firstInvalidField);
      return;
    }
    onSave(input);
  }

  function clearFieldError(event: FormEvent<HTMLFormElement>) {
    const field = (event.target as HTMLInputElement).name as NewStaffField;
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  function controlProps(field: NewStaffField, describedBy?: string) {
    const errorId = errors[field] ? getFieldErrorId(field) : undefined;
    return {
      id: field,
      name: field,
      "aria-invalid": errors[field] ? true : undefined,
      "aria-describedby":
        [errorId, describedBy].filter(Boolean).join(" ") || undefined,
    };
  }

  return (
    <form
      ref={formRef}
      noValidate
      onSubmit={handleSubmit}
      onChange={clearFieldError}
      className="flex min-h-0 flex-1 flex-col"
    >
      <header className="flex shrink-0 items-center justify-between border-b border-line px-[26px] py-5">
        <button
          type="button"
          onClick={onCancel}
          className="cursor-pointer text-[15px] font-bold text-muted-strong"
        >
          Cancelar
        </button>
        <h2
          id={titleId}
          className="m-0 font-display text-lg leading-[normal] font-semibold text-ink"
        >
          Agregar staff
        </h2>
        <button
          type="submit"
          className="cursor-pointer text-[15px] font-extrabold text-coral-strong"
        >
          Guardar
        </button>
      </header>
      <div className="flex min-h-0 min-w-0 flex-col gap-[18px] overflow-y-auto px-[26px] py-6">
        <FormField id="firstName" label="NOMBRES" error={errors.firstName}>
          <input
            {...controlProps("firstName")}
            maxLength={NAME_MAX_LENGTH}
            placeholder="Ej. Carolina"
            className={fieldControlClassName}
          />
        </FormField>
        <FormField id="lastName" label="APELLIDOS" error={errors.lastName}>
          <input
            {...controlProps("lastName")}
            maxLength={NAME_MAX_LENGTH}
            placeholder="Ej. Paz Rojas"
            className={fieldControlClassName}
          />
        </FormField>
        <FormField id="email" label="EMAIL" error={errors.email}>
          <input
            {...controlProps("email")}
            type="email"
            autoComplete="off"
            placeholder="nombre@casanogal.pe"
            className={fieldControlClassName}
          />
        </FormField>
        <FormField
          id="emailConfirmation"
          label="CONFIRMAR EMAIL"
          error={errors.emailConfirmation}
        >
          <input
            {...controlProps("emailConfirmation", CONFIRMATION_HELP_ID)}
            type="email"
            autoComplete="off"
            placeholder="Repite el email"
            onPaste={(event) => event.preventDefault()}
            onDrop={(event) => event.preventDefault()}
            className={fieldControlClassName}
          />
          <p
            id={CONFIRMATION_HELP_ID}
            className="mt-1.5 text-[13px] text-muted"
          >
            Escríbelo de nuevo, sin copiar y pegar.
          </p>
        </FormField>
      </div>
    </form>
  );
}
