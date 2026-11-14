"use client";

import { useId, useRef, useState, useTransition, type Ref } from "react";
import { avatarTones } from "@/elderly/avatar-tones";
import { Avatar } from "@/shared/components/Avatar";
import { PlusIcon } from "@/shared/components/icons/PlusIcon";
import { SearchIcon } from "@/shared/components/icons/SearchIcon";
import { normalizeSearch } from "@/shared/text/normalize-search";
import type { ElderlyOption } from "../types";

type LinkElderlyDialogProps = {
  staffFullName: string;
  options: ElderlyOption[]; // activos y no vinculados, por nombre
  onLink: (selected: ElderlyOption[]) => Promise<boolean>; // true: guardó
  triggerRef: Ref<HTMLButtonElement>;
};

type LinkElderlyPickerProps = Omit<
  LinkElderlyDialogProps,
  "triggerRef" | "onLink"
> & {
  titleId: string;
  isPending: boolean;
  onLink: (selected: ElderlyOption[]) => void;
  onCancel: () => void;
};

function LinkElderlyPicker({
  staffFullName,
  options,
  titleId,
  isPending,
  onLink,
  onCancel,
}: LinkElderlyPickerProps) {
  const [query, setQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const normalizedQuery = normalizeSearch(query.trim());
  const visible = options.filter((option) =>
    normalizeSearch(option.fullName).includes(normalizedQuery),
  );

  function toggle(id: string) {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((selectedId) => selectedId !== id)
        : [...current, id],
    );
  }

  function link() {
    onLink(options.filter((option) => selectedIds.includes(option.id)));
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="shrink-0 px-[22px] pt-5 pb-3">
        <h2
          id={titleId}
          className="m-0 font-display text-lg leading-[normal] font-semibold text-ink"
        >
          Vincular adulto mayor
        </h2>
        <p className="m-0 mt-1 text-[14px] text-muted-strong">
          Elige a quién cuidará {staffFullName}.
        </p>
      </header>
      <label className="mx-[22px] mb-3 flex shrink-0 items-center gap-[11px] rounded-[14px] border border-line bg-surface px-4 py-2.5 focus-within:border-coral">
        <SearchIcon size={18} className="flex-none text-[#B0A290]" />
        <input
          type="search"
          aria-label="Buscar adulto mayor"
          placeholder="Buscar adulto mayor…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="min-w-0 flex-1 bg-transparent px-0.5 py-px text-[15px] text-ink outline-none placeholder:text-[#B6A99B]"
        />
      </label>
      <div className="min-h-0 flex-1 overflow-y-auto px-[22px] pb-3">
        {options.length === 0 && (
          <p className="m-0 py-4 text-center text-[14.5px] text-muted-strong">
            Todos los adultos mayores activos ya están vinculados.
          </p>
        )}
        {options.length > 0 && visible.length === 0 && (
          <p className="m-0 py-4 text-center text-[14.5px] text-muted-strong">
            No encontramos adultos mayores con ese nombre.
          </p>
        )}
        <ul className="m-0 flex list-none flex-col gap-1 p-0">
          {visible.map((option) => (
            <li key={option.id}>
              <label className="flex cursor-pointer items-center gap-3 rounded-xl px-2 py-2 has-checked:bg-coral-soft has-focus-visible:outline-2 has-focus-visible:outline-coral">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(option.id)}
                  onChange={() => toggle(option.id)}
                  disabled={isPending}
                  className="size-[18px] flex-none cursor-pointer accent-[#D9583C]"
                />
                <Avatar
                  initial={option.initial}
                  size={40}
                  fontSize={16}
                  colors={avatarTones[option.tone]}
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-[14.5px] font-extrabold text-ink">
                    {option.fullName}
                  </span>
                  <span className="block text-[12.5px] text-muted">
                    Habitación {option.roomName}
                  </span>
                </span>
              </label>
            </li>
          ))}
        </ul>
      </div>
      <footer className="flex shrink-0 justify-end gap-3 border-t border-line px-[22px] py-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={isPending}
          className="cursor-pointer rounded-[14px] border-[1.5px] border-line bg-surface px-[18px] py-[11px] text-[14.5px] font-bold text-nav focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral disabled:cursor-default disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={link}
          disabled={selectedIds.length === 0 || isPending}
          className="cursor-pointer rounded-[14px] bg-linear-to-b from-[#F4977E] to-[#EE8164] px-[18px] py-[11px] text-[14.5px] font-extrabold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral-strong disabled:cursor-default disabled:opacity-50"
        >
          {isPending ? "Vinculando…" : `Vincular (${selectedIds.length})`}
        </button>
      </footer>
    </div>
  );
}

export function LinkElderlyDialog({
  staffFullName,
  options,
  onLink,
  triggerRef,
}: LinkElderlyDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  // Cambiar la key remonta el selector: sin selección ni texto de búsqueda
  const [pickerKey, setPickerKey] = useState(0);
  const [isPending, startTransition] = useTransition();

  function link(selected: ElderlyOption[]) {
    startTransition(async () => {
      if (await onLink(selected)) dialogRef.current?.close();
    });
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        className="flex cursor-pointer items-center gap-3 pt-2 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral"
      >
        <span className="flex size-10 flex-none items-center justify-center rounded-full border-[1.5px] border-dashed border-[#D8CBBA] text-photo-ink">
          <PlusIcon size={18} strokeWidth={2.2} />
        </span>
        <span className="text-[14.5px] font-extrabold text-coral-link">
          Vincular otro adulto mayor
        </span>
      </button>
      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        onClose={() => setPickerKey((key) => key + 1)}
        // Mientras guarda, Esc no cierra el modal
        onCancel={(event) => isPending && event.preventDefault()}
        className="m-auto max-h-[calc(100dvh-32px)] w-[calc(100%-32px)] max-w-[480px] overflow-hidden rounded-3xl border border-line bg-auth-bg p-0 text-ink shadow-[0_20px_50px_-24px_rgba(63,54,46,0.35)] backdrop:bg-ink/40 open:flex open:flex-col"
      >
        <LinkElderlyPicker
          key={pickerKey}
          staffFullName={staffFullName}
          options={options}
          titleId={titleId}
          isPending={isPending}
          onLink={link}
          onCancel={() => dialogRef.current?.close()}
        />
      </dialog>
    </>
  );
}
