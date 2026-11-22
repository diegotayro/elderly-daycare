"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { ProfileChangesSummary } from "@/account/components/ProfileChangesSummary";
import { diffProfileChanges } from "@/account/diff-profile-changes";
import type {
  ProfileChanges,
  ProfileErrors,
  ProfileField,
} from "@/account/types";
import { validateProfileNames } from "@/account/validate-profile";
import {
  FormField,
  fieldControlClassName,
  getFieldErrorId,
} from "@/elderly/components/FormField";
import { NAME_MAX_LENGTH } from "@/elderly/validate-new-elderly";

const FIELD_ORDER: ProfileField[] = ["firstName", "lastName"];

export type EditUserValues = { firstName: string; lastName: string };

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
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<ProfileErrors>({});
  const formRef = useRef<HTMLFormElement>(null);
  // Los campos siguen deshabilitados mientras se guarda: el foco se mueve al terminar
  const mustFocusInvalidField = useRef(false);

  const changes = diffProfileChanges(initialValues, values);
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

  function showErrors(nextErrors: ProfileErrors) {
    mustFocusInvalidField.current = true;
    setErrors(nextErrors);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isPending || !hasChanges) return;

    const clientErrors = validateProfileNames(changes);
    if (Object.keys(clientErrors).length > 0) {
      showErrors(clientErrors);
      return;
    }
    setErrors({});
    onSave(changes, showErrors);
  }

  function updateField(field: keyof EditUserValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  function controlProps(field: keyof EditUserValues) {
    return {
      id: field,
      name: field,
      value: values[field],
      onChange: (event: FormEvent<HTMLInputElement>) =>
        updateField(field, event.currentTarget.value),
      maxLength: NAME_MAX_LENGTH,
      className: fieldControlClassName,
      "aria-invalid": errors[field] ? true : undefined,
      "aria-describedby": errors[field] ? getFieldErrorId(field) : undefined,
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
        <ProfileChangesSummary changedFields={changedFields} />
        <FormField id="firstName" label="NOMBRES" error={errors.firstName}>
          <input {...controlProps("firstName")} />
        </FormField>
        <FormField id="lastName" label="APELLIDOS" error={errors.lastName}>
          <input {...controlProps("lastName")} />
        </FormField>
      </fieldset>
    </form>
  );
}
