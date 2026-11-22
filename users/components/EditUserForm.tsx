"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { profileFieldLabels } from "@/account/account-messages";
import { diffProfileChanges } from "@/account/diff-profile-changes";
import type {
  ProfileChanges,
  ProfileErrors,
  ProfileField,
} from "@/account/types";
import {
  validateEmailConfirmation,
  validateProfileChanges,
} from "@/account/validate-profile";
import {
  FormField,
  fieldControlClassName,
  getFieldErrorId,
} from "@/elderly/components/FormField";
import { NAME_MAX_LENGTH } from "@/elderly/validate-elderly-form";
import { ChangesSummary } from "@/shared/components/ChangesSummary";

type EditField = ProfileField | "emailConfirmation";
type FormErrors = Partial<Record<EditField, string>>;

const FIELD_ORDER: EditField[] = [
  "firstName",
  "lastName",
  "email",
  "emailConfirmation",
];
const CONFIRMATION_HELP_ID = "emailConfirmation-help";

// Sin `email` el modal no muestra ese campo (el admin no cambia su propio email ni el de un staff pending)
export type EditUserValues = {
  firstName: string;
  lastName: string;
  email?: string;
};

type EditUserFormProps = {
  titleId: string;
  title: string;
  initialValues: EditUserValues;
  isPending: boolean;
  onCancel: () => void;
  // El padre guarda y, si el servidor rechaza campos, los devuelve por showFieldErrors
  onSave: (
    changes: ProfileChanges,
    showFieldErrors: (errors: ProfileErrors) => void,
  ) => void;
};

export function EditUserForm({
  titleId,
  title,
  initialValues,
  isPending,
  onCancel,
  onSave,
}: EditUserFormProps) {
  const showEmail = initialValues.email !== undefined;
  const [values, setValues] = useState<Record<EditField, string>>({
    firstName: initialValues.firstName,
    lastName: initialValues.lastName,
    email: initialValues.email ?? "",
    emailConfirmation: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const formRef = useRef<HTMLFormElement>(null);
  // Los campos siguen deshabilitados mientras se guarda: el foco se mueve al terminar
  const mustFocusInvalidField = useRef(false);

  const changes = diffProfileChanges(initialValues, {
    firstName: values.firstName,
    lastName: values.lastName,
    ...(showEmail && { email: values.email }),
  });
  const changedFields = Object.keys(changes) as ProfileField[];
  const hasChanges = changedFields.length > 0;

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

  function showErrors(nextErrors: FormErrors) {
    mustFocusInvalidField.current = true;
    setErrors(nextErrors);
  }

  // "Confirmar email" solo se exige si el email cambió
  function validate(): FormErrors {
    const candidates: FormErrors = {
      ...validateProfileChanges(changes),
      emailConfirmation:
        changes.email === undefined
          ? undefined
          : validateEmailConfirmation(changes.email, values.emailConfirmation),
    };
    return Object.fromEntries(
      Object.entries(candidates).filter(([, message]) => message !== undefined),
    );
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isPending || !hasChanges) return;

    const clientErrors = validate();
    if (Object.keys(clientErrors).length > 0) {
      showErrors(clientErrors);
      return;
    }
    setErrors({});
    onSave(changes, showErrors);
  }

  function updateField(field: EditField, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  function controlProps(field: EditField, describedBy?: string) {
    const errorId = errors[field] ? getFieldErrorId(field) : undefined;
    return {
      id: field,
      name: field,
      value: values[field],
      onChange: (event: FormEvent<HTMLInputElement>) =>
        updateField(field, event.currentTarget.value),
      className: fieldControlClassName,
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
      className="flex min-h-0 flex-1 flex-col"
    >
      <header className="flex shrink-0 items-center justify-between border-b border-line px-[26px] py-5">
        <button
          type="button"
          onClick={onCancel}
          disabled={isPending}
          className="cursor-pointer text-[15px] font-bold text-muted-strong disabled:cursor-default disabled:opacity-50"
        >
          Cancelar
        </button>
        <h2
          id={titleId}
          className="m-0 font-display text-lg leading-[normal] font-semibold text-ink"
        >
          {title}
        </h2>
        <button
          type="submit"
          disabled={isPending || !hasChanges}
          className="cursor-pointer text-[15px] font-extrabold text-coral-strong disabled:cursor-default disabled:opacity-50"
        >
          {isPending ? "Guardando…" : "Guardar"}
        </button>
      </header>
      <fieldset
        disabled={isPending}
        className="m-0 flex min-h-0 min-w-0 flex-col gap-[18px] overflow-y-auto border-0 px-[26px] py-6"
      >
        <ChangesSummary
          fieldLabels={changedFields.map((field) => profileFieldLabels[field])}
        />
        <FormField id="firstName" label="NOMBRES" error={errors.firstName}>
          <input {...controlProps("firstName")} maxLength={NAME_MAX_LENGTH} />
        </FormField>
        <FormField id="lastName" label="APELLIDOS" error={errors.lastName}>
          <input {...controlProps("lastName")} maxLength={NAME_MAX_LENGTH} />
        </FormField>
        {showEmail && (
          <>
            <FormField id="email" label="EMAIL" error={errors.email}>
              <input
                {...controlProps("email")}
                type="email"
                autoComplete="off"
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
              />
              <p
                id={CONFIRMATION_HELP_ID}
                className="mt-1.5 text-[13px] text-muted"
              >
                Escríbelo de nuevo, sin copiar y pegar.
              </p>
            </FormField>
          </>
        )}
      </fieldset>
    </form>
  );
}
