import { avatarTones } from "@/elderly/avatar-tones";
import { Avatar } from "@/shared/components/Avatar";
import type { FamilyElderly } from "../types";

type ElderlyFilterChipsProps = {
  elderly: FamilyElderly[];
  selectedId: string | null; // null = "Todos"
  onSelect: (elderlyId: string | null) => void;
  includeAll?: boolean;
};

const chipBaseClassName =
  "flex cursor-pointer items-center rounded-full border-[1.5px] text-sm font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral-strong";

function chipStateClassName(isSelected: boolean) {
  return isSelected
    ? "border-ink bg-ink text-white"
    : "border-line bg-surface text-nav";
}

export function ElderlyFilterChips({
  elderly,
  selectedId,
  onSelect,
  includeAll = false,
}: ElderlyFilterChipsProps) {
  return (
    <div className="mb-[22px] flex flex-wrap gap-2.5">
      {elderly.map(({ id, firstName, initial, tone }) => (
        <button
          key={id}
          type="button"
          aria-pressed={selectedId === id}
          onClick={() => onSelect(id)}
          className={`${chipBaseClassName} gap-2 py-[7px] pr-[15px] pl-2 ${chipStateClassName(selectedId === id)}`}
        >
          <Avatar
            initial={initial}
            size={26}
            fontSize={13}
            colors={avatarTones[tone]}
          />
          {firstName}
        </button>
      ))}
      {includeAll && (
        <button
          type="button"
          aria-pressed={selectedId === null}
          onClick={() => onSelect(null)}
          className={`${chipBaseClassName} px-4 py-[7px] ${chipStateClassName(selectedId === null)}`}
        >
          Todos
        </button>
      )}
    </div>
  );
}
