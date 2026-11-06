"use client";

import type { FormEvent } from "react";
import { ChevronDownIcon } from "@/shared/components/icons/ChevronDownIcon";
import type { RoomOption } from "../types";
import { FormField, fieldControlClassName } from "./FormField";

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
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="flex min-h-0 flex-col">
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
        <FormField id="firstName" label="NOMBRES">
          <input
            id="firstName"
            name="firstName"
            placeholder="Ej. Rosa"
            className={fieldControlClassName}
          />
        </FormField>
        <FormField id="lastName" label="APELLIDOS">
          <input
            id="lastName"
            name="lastName"
            placeholder="Ej. Méndez Paredes"
            className={fieldControlClassName}
          />
        </FormField>
        <FormField id="birthDate" label="FECHA DE NACIMIENTO">
          <input
            id="birthDate"
            name="birthDate"
            type="date"
            max={today}
            className={fieldControlClassName}
          />
        </FormField>
        <FormField id="enrolledAt" label="FECHA DE INGRESO">
          <input
            id="enrolledAt"
            name="enrolledAt"
            type="date"
            className={fieldControlClassName}
          />
        </FormField>
        <FormField id="roomId" label="HABITACIÓN">
          <div className="relative">
            <select
              id="roomId"
              name="roomId"
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
        <FormField id="allergies" label="ALERGIAS (ETIQUETAS)">
          <input
            id="allergies"
            name="allergies"
            placeholder="Ej. Maní, Lactosa"
            className={fieldControlClassName}
          />
        </FormField>
        <FormField id="medicalNotes" label="NOTAS MÉDICAS">
          <textarea
            id="medicalNotes"
            name="medicalNotes"
            placeholder="Indicaciones, medicación, contactos…"
            className={`${fieldControlClassName} min-h-[90px] resize-y leading-normal`}
          />
        </FormField>
      </div>
    </form>
  );
}
