"use client";

import { useId, useRef } from "react";
import { PlusIcon } from "@/shared/components/icons/PlusIcon";
import type { RoomOption } from "../types";
import { AddElderlyForm } from "./AddElderlyForm";

type AddElderlyDialogProps = {
  rooms: RoomOption[];
  today: string;
};

export function AddElderlyDialog({ rooms, today }: AddElderlyDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        className="flex cursor-pointer items-center gap-2 whitespace-nowrap rounded-[14px] bg-linear-to-b from-[#F4977E] to-[#EE8164] px-[18px] py-[11px] text-[14.5px] font-extrabold text-white shadow-[0_8px_18px_-8px_rgba(238,129,100,0.7)]"
      >
        <PlusIcon size={17} />
        Agregar adulto mayor
      </button>
      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        className="m-0 w-full max-w-[520px] overflow-hidden border border-line bg-auth-bg p-0 text-ink backdrop:bg-ink/40 open:flex open:flex-col sm:mx-auto sm:mt-10 sm:mb-auto sm:max-h-[calc(100dvh-80px)] sm:rounded-3xl sm:shadow-[0_20px_50px_-24px_rgba(63,54,46,0.35)]"
      >
        <AddElderlyForm
          rooms={rooms}
          today={today}
          titleId={titleId}
          onCancel={() => dialogRef.current?.close()}
        />
      </dialog>
    </>
  );
}
