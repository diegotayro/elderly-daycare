"use client";

import { useState, type FormEvent } from "react";
import { ChevronDownIcon } from "@/shared/components/icons/ChevronDownIcon";
import type {
  NewElderlyErrors,
  NewElderlyField,
  NewElderlyInput,
  RoomOption,
} from "../types";
import { validateNewElderly } from "../validate-new-elderly";
import { FormField, fieldControlClassName, getFieldErrorId } from "./FormField";

const FIELD_ORDER: NewElderlyField[] = [
  "firstName",
  "lastName",
  "birthDate",
  "enrolledAt",
  "roomId",
  "allergies",
  "medicalNotes",
];

function readInput(formData: FormData): NewElderlyInput {
  const read = (field: NewElderlyField) => String(formData.get(field) ?? "");
  return {
    firstName: read("firstName"),
    lastName: read("lastName"),
    birthDate: read("birthDate"),
    enrolledAt: read("enrolledAt"),
    roomId: read("roomId"),
    allergies: read("allergies"),
    medicalNotes: read("medicalNotes"),
  };
}

type AddElderlyFormProps = {
  rooms: RoomOption[];
  today: string;
  titleId: string;
  onCancel: () => void;
};

export function AddElderlyForm({
  rooms,
  today,
  titleId,
  onCancel,
}: AddElderlyFormProps) {
  const [errors, setErrors] = useState<NewElderlyErrors>({});

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const nextErrors = validateNewElderly(readInput(new FormData(form)), {
      today,
      roomIds: rooms.map((room) => room.id),
    });
    setErrors(nextErrors);

    const firstInvalidField = FIELD_ORDER.find((field) => nextErrors[field]);
    if (firstInvalidField) {
      form.querySelector<HTMLElement>(`[name="${firstInvalidField}"]`)?.focus();
    }
  }

  function clearFieldError(event: FormEvent<HTMLFormElement>) {
    const field = (event.target as HTMLInputElement).name as NewElderlyField;
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  function controlProps(field: NewElderlyField) {
    return {
      id: field,
      name: field,
      "aria-invalid": errors[field] ? true : undefined,
      "aria-describedby": errors[field] ? getFieldErrorId(field) : undefined,
    };
  }

  return (
    <form
      noValidate
      onSubmit={handleSubmit}
      onChange={clearFieldError}
      className="flex min-h-0 flex-col"
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
          Agregar adulto mayor
        </h2>
        <button
          type="submit"
          className="cursor-pointer text-[15px] font-extrabold text-coral-strong"
        >
          Guardar
        </button>
      </header>
      <div className="flex min-h-0 flex-col gap-[18px] overflow-y-auto px-[26px] py-6">
        <FormField id="firstName" label="NOMBRES" error={errors.firstName}>
          <input
            {...controlProps("firstName")}
            placeholder="Ej. Rosa"
            className={fieldControlClassName}
          />
        </FormField>
        <FormField id="lastName" label="APELLIDOS" error={errors.lastName}>
          <input
            {...controlProps("lastName")}
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
            type="date"
            className={fieldControlClassName}
          />
        </FormField>
        <FormField id="roomId" label="HABITACIÓN" error={errors.roomId}>
          <div className="relative">
            <select
              {...controlProps("roomId")}
              defaultValue={rooms[0]?.id}
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
            placeholder="Indicaciones, medicación, contactos…"
            className={`${fieldControlClassName} min-h-[90px] resize-y leading-normal`}
          />
        </FormField>
      </div>
    </form>
  );
}
