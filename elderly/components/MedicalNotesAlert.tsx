import { AlertIcon } from "@/shared/components/icons/AlertIcon";

type MedicalNotesAlertProps = {
  notes: string;
};

export function MedicalNotesAlert({ notes }: MedicalNotesAlertProps) {
  return (
    <div className="flex gap-3.5 rounded-2xl bg-[#FBDAD6] px-[18px] py-4">
      <div className="flex size-10 flex-none items-center justify-center rounded-[11px] bg-[#F4A8A0] text-white">
        <AlertIcon size={22} />
      </div>
      <div>
        <div className="mb-0.5 text-[15px] font-extrabold text-[#C5413A]">
          Alergias y notas
        </div>
        <div className="text-[14.5px] leading-normal text-[#B25249]">
          {notes}
        </div>
      </div>
    </div>
  );
}
