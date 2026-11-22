"use client";

import type { ToastMessage } from "@/shared/components/toast/types";
import { updateElderly } from "../actions/update-elderly";
import type { ElderlyFormValues, RoomOption } from "../types";
import { ElderlyFormDialog } from "./ElderlyFormDialog";

const successToast: ToastMessage = {
  tone: "success",
  title: "Cambios guardados",
};

type EditElderlyDialogProps = {
  elderlyId: string;
  editValues: ElderlyFormValues;
  roomOptions: RoomOption[];
  today: string;
};

export function EditElderlyDialog({
  elderlyId,
  editValues,
  roomOptions,
  today,
}: EditElderlyDialogProps) {
  return (
    <ElderlyFormDialog
      title="Editar adulto mayor"
      rooms={roomOptions}
      today={today}
      initialValues={editValues}
      action={(formData) => updateElderly(elderlyId, formData)}
      getSuccessToast={() => successToast}
      trigger={
        <button
          type="button"
          className="cursor-pointer rounded-xl border-[1.5px] border-line bg-surface px-4 py-[9px] text-sm font-bold text-nav"
        >
          Editar
        </button>
      }
    />
  );
}
