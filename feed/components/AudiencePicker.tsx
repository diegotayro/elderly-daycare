import { avatarTones } from "@/elderly/avatar-tones";
import { ChevronDownIcon } from "@/shared/components/icons/ChevronDownIcon";
import type { RoomOption } from "@/elderly/types";
import {
  fieldControlClassName,
  getFieldErrorId,
} from "@/elderly/components/FormField";
import { FieldError } from "./FieldError";
import type {
  AudienceChip,
  AudienceElderlyOption,
  AudienceSelection,
} from "../types";

const CHIP_BASE_CLASS_NAME =
  "flex cursor-pointer items-center rounded-full border-[1.5px] text-sm font-bold aria-pressed:border-ink aria-pressed:bg-ink aria-pressed:text-white border-line bg-surface text-nav";

type AudiencePickerProps = {
  labelId: string;
  error?: string;
  elderly: AudienceElderlyOption[];
  rooms: RoomOption[];
  selection: AudienceSelection;
  onToggle: (chip: AudienceChip) => void;
  onRoomChange: (roomId: string) => void;
};

export function AudiencePicker({
  labelId,
  error,
  elderly,
  rooms,
  selection,
  onToggle,
  onRoomChange,
}: AudiencePickerProps) {
  const selectedElderlyIds =
    selection.kind === "elderly" ? selection.elderlyIds : [];

  return (
    <div>
      <div
        id={labelId}
        className="mb-2.5 text-xs font-extrabold tracking-[0.7px] text-muted-strong"
      >
        PARA
      </div>
      <div
        role="group"
        aria-labelledby={labelId}
        aria-describedby={error ? getFieldErrorId("audience") : undefined}
        className="flex flex-wrap gap-[9px]"
      >
        {elderly.map((option) => (
          <button
            key={option.id}
            type="button"
            data-audience-chip
            aria-pressed={selectedElderlyIds.includes(option.id)}
            onClick={() => onToggle({ kind: "elderly", elderlyId: option.id })}
            className={`${CHIP_BASE_CLASS_NAME} gap-2 py-1.5 pr-3.5 pl-1.5`}
          >
            <span
              className="flex size-[26px] items-center justify-center rounded-full font-display text-[13px] font-semibold"
              style={{
                backgroundColor: avatarTones[option.tone].bg,
                color: avatarTones[option.tone].fg,
              }}
            >
              {option.initial}
            </span>
            {option.firstName}
          </button>
        ))}
        <button
          type="button"
          data-audience-chip
          aria-pressed={selection.kind === "room"}
          onClick={() => onToggle({ kind: "room" })}
          className={`${CHIP_BASE_CLASS_NAME} px-4 py-1.5`}
        >
          Toda la habitación
        </button>
        <button
          type="button"
          data-audience-chip
          aria-pressed={selection.kind === "daycare"}
          onClick={() => onToggle({ kind: "daycare" })}
          className={`${CHIP_BASE_CLASS_NAME} px-4 py-1.5`}
        >
          Toda la guardería
        </button>
      </div>
      <FieldError fieldId="audience" message={error} />
      {selection.kind === "room" && (
        <div className="mt-4">
          <label
            htmlFor="roomId"
            className="mb-2 block text-xs font-extrabold tracking-[0.7px] text-muted-strong"
          >
            HABITACIÓN
          </label>
          <div className="relative">
            <select
              id="roomId"
              name="roomId"
              value={selection.roomId}
              onChange={(event) => onRoomChange(event.target.value)}
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
        </div>
      )}
    </div>
  );
}
