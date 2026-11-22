"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { ChevronDownIcon } from "@/shared/components/icons/ChevronDownIcon";
import { ChangesSummary } from "@/shared/components/ChangesSummary";
import { diffElderlyChanges } from "../diff-elderly-changes";
import { elderlyFieldLabels } from "../elderly-field-labels";
import { readElderlyFormValues } from "../read-elderly-form-values";
import type {
  ElderlyFormErrors,
  ElderlyFormField,
  ElderlyFormValues,
  RoomOption,
} from "../types";
import {
  MEDICAL_NOTES_MAX_LENGTH,
  NAME_MAX_LENGTH,
  validateElderlyForm,
} from "../validate-elderly-form";
import { FormField, fieldControlClassName, getFieldErrorId } from "./FormField";

const FIELD_ORDER: ElderlyFormField[] = [
  "firstName",
  "lastName",
  "birthDate",
  "enrolledAt",
  "roomId",
  "allergies",
  "medicalNotes",
];

type ElderlyFormProps = {
  rooms: RoomOption[];
  today: string;
  title: string;
  titleId: string;
  // Con valores iniciales el formulario es de edición: solo se puede guardar lo que cambió
  initialValues?: ElderlyFormValues;
  isPending: boolean;
  onCancel: () => void;
  // El padre guarda y, si el servidor rechaza campos, los devuelve por showFieldErrors
  onSave: (
    formData: FormData,
    showFieldErrors: (errors: ElderlyFormErrors) => void,
  ) => void;
};

export function ElderlyForm({
  rooms,
  today,
  title,
  titleId,
  initialValues,
  isPending,
  onCancel,
  onSave,
}: ElderlyFormProps) {
  const [errors, setErrors] = useState<ElderlyFormErrors>({});
  const [changedFields, setChangedFields] = useState<ElderlyFormField[]>([]);
  const isEditing = initialValues !== undefined;
  const hasNoChangesToSave = isEditing && changedFields.length === 0;
  const formRef = useRef<HTMLFormElement>(null);
  // Los campos siguen deshabilitados mientras se guarda: el foco se mueve al terminar
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

  function showErrors(nextErrors: ElderlyFormErrors) {
    mustFocusInvalidField.current = true;
    setErrors(nextErrors);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isPending) return;
    const formData = new FormData(event.currentTarget);
    const clientErrors = validateElderlyForm(readElderlyFormValues(formData), {
      today,
      roomIds: rooms.map((room) => room.id),
    });

    if (Object.keys(clientErrors).length > 0) {
      showErrors(clientErrors);
      return;
    }
    setErrors({});
    onSave(formData, showErrors);
  }

  function handleChange(event: FormEvent<HTMLFormElement>) {
    const field = (event.target as HTMLInputElement).name as ElderlyFormField;
    setErrors((current) => ({ ...current, [field]: undefined }));
    if (initialValues) {
      const currentValues = readElderlyFormValues(
        new FormData(event.currentTarget),
      );
      setChangedFields(diffElderlyChanges(initialValues, currentValues));
    }
  }

  function controlProps(field: ElderlyFormField) {
    return {
      id: field,
      name: field,
      "aria-invalid": errors[field] ? true : undefined,
      "aria-describedby": errors[field] ? getFieldErrorId(field) : undefined,
    };
  }

  return (
    <form
      ref={formRef}
      noValidate
      onSubmit={handleSubmit}
      onChange={handleChange}
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
          disabled={isPending || hasNoChangesToSave}
          className="cursor-pointer text-[15px] font-extrabold text-coral-strong disabled:cursor-default disabled:opacity-50"
        >
          {isPending ? "Guardando…" : "Guardar"}
        </button>
      </header>
      <fieldset
        disabled={isPending}
        className="m-0 flex min-h-0 min-w-0 flex-col gap-[18px] overflow-y-auto border-0 px-[26px] py-6"
      >
        {isEditing && (
          <ChangesSummary
            fieldLabels={changedFields.map(
              (field) => elderlyFieldLabels[field],
            )}
          />
        )}
        <FormField id="firstName" label="NOMBRES" error={errors.firstName}>
          <input
            {...controlProps("firstName")}
            defaultValue={initialValues?.firstName}
            maxLength={NAME_MAX_LENGTH}
            placeholder="Ej. Rosa"
            className={fieldControlClassName}
          />
        </FormField>
        <FormField id="lastName" label="APELLIDOS" error={errors.lastName}>
          <input
            {...controlProps("lastName")}
            defaultValue={initialValues?.lastName}
            maxLength={NAME_MAX_LENGTH}
            placeholder="Ej. Méndez Paredes"
            className={fieldControlClassName}
          />
        </FormField>
        <FormField
          id="birthDate"
          label="FECHA DE NACIMIENTO"
          error={errors.birthDate}
        >
          <input
            {...controlProps("birthDate")}
            defaultValue={initialValues?.birthDate}
            type="date"
            max={today}
            className={fieldControlClassName}
          />
        </FormField>
        <FormField
          id="enrolledAt"
          label="FECHA DE INGRESO"
          error={errors.enrolledAt}
        >
          <input
            {...controlProps("enrolledAt")}
            defaultValue={initialValues?.enrolledAt}
            type="date"
            className={fieldControlClassName}
          />
        </FormField>
        <FormField id="roomId" label="HABITACIÓN" error={errors.roomId}>
          <div className="relative">
            <select
              {...controlProps("roomId")}
              defaultValue={initialValues?.roomId ?? rooms[0]?.id}
              className={`${fieldControlClassName} cursor-pointer appearance-none pr-11 font-bold`}
            >
              {rooms.map((room) => (
                <option key={room.id} value={room.id}>
                  {room.name}
                </option>
              ))}
            </select>
            <ChevronDownIcon
              size={16}
              className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-photo-ink"
            />
          </div>
        </FormField>
        <FormField
          id="allergies"
          label="ALERGIAS (ETIQUETAS)"
          error={errors.allergies}
        >
          <input
            {...controlProps("allergies")}
            defaultValue={initialValues?.allergies}
            placeholder="Ej. Maní, Lactosa"
            className={fieldControlClassName}
          />
        </FormField>
        <FormField
          id="medicalNotes"
          label="NOTAS MÉDICAS"
          error={errors.medicalNotes}
        >
          <textarea
            {...controlProps("medicalNotes")}
            defaultValue={initialValues?.medicalNotes}
            maxLength={MEDICAL_NOTES_MAX_LENGTH}
            placeholder="Indicaciones, medicación, contactos…"
            className={`${fieldControlClassName} min-h-[90px] resize-y leading-normal`}
          />
        </FormField>
      </fieldset>
    </form>
  );
}
