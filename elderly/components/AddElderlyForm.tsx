"use client";

import type { FormEvent } from "react";
import type { RoomOption } from "../types";

type AddElderlyFormProps = {
  rooms: RoomOption[];
  today: string;
  titleId: string;
  onCancel: () => void;
};

export function AddElderlyForm({ titleId, onCancel }: AddElderlyFormProps) {
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
      <div className="min-h-0 overflow-y-auto px-[26px] py-6" />
    </form>
  );
}
