"use client";

import { PlusIcon } from "@/shared/components/icons/PlusIcon";
import type { ToastMessage } from "@/shared/components/toast/types";
import { createElderly } from "../actions/create-elderly";
import type { CreateElderlyResult, RoomOption } from "../types";
import { ElderlyFormDialog } from "./ElderlyFormDialog";

function successToast({
  fullName,
}: Extract<CreateElderlyResult, { status: "success" }>): ToastMessage {
  return {
    tone: "success",
    title: "Adulto mayor agregado",
    description: `${fullName} ya está en la lista.`,
  };
}

type AddElderlyDialogProps = {
  rooms: RoomOption[];
  today: string;
};

export function AddElderlyDialog({ rooms, today }: AddElderlyDialogProps) {
  return (
    <ElderlyFormDialog
      title="Agregar adulto mayor"
      rooms={rooms}
      today={today}
      action={createElderly}
      getSuccessToast={successToast}
      trigger={
        <button
          type="button"
          className="flex cursor-pointer items-center gap-2 whitespace-nowrap rounded-[14px] bg-linear-to-b from-[#F4977E] to-[#EE8164] px-[18px] py-[11px] text-[14.5px] font-extrabold text-white shadow-[0_8px_18px_-8px_rgba(238,129,100,0.7)]"
        >
          <PlusIcon size={17} />
          Agregar adulto mayor
        </button>
      }
    />
  );
}
