"use client";

import type { NewPostOptions } from "../types";

type NewPostFormProps = {
  options: NewPostOptions;
  titleId: string;
  onCancel: () => void;
};

export function NewPostForm({ titleId, onCancel }: NewPostFormProps) {
  return (
    <form noValidate className="flex min-h-0 flex-1 flex-col">
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
          Nueva publicación
        </h2>
        <button
          type="submit"
          className="cursor-pointer text-[15px] font-extrabold text-coral-strong"
        >
          Publicar
        </button>
      </header>
    </form>
  );
}
