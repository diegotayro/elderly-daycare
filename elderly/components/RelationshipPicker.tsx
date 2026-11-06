import type { RelationshipType } from "@/shared/database/types";
import { relationshipLabels } from "../relationship-labels";

const OPTIONS = Object.entries(relationshipLabels) as [
  RelationshipType,
  (typeof relationshipLabels)[RelationshipType],
][];

type RelationshipPickerProps = {
  defaultValue: RelationshipType;
};

export function RelationshipPicker({ defaultValue }: RelationshipPickerProps) {
  return (
    <fieldset className="m-0 min-w-0 border-0 p-0">
      <legend className="mb-2.5 p-0 text-xs font-extrabold tracking-[0.7px] text-muted-strong">
        PARENTESCO
      </legend>
      <div className="flex gap-[9px]">
        {OPTIONS.map(([value, { label }]) => (
          <label
            key={value}
            className="flex flex-1 cursor-pointer items-center justify-center rounded-full border-[1.5px] border-line bg-surface p-[11px] text-sm font-extrabold text-nav has-checked:border-pill-selected-line has-checked:bg-pill-selected-bg has-checked:text-notice-icon has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-notice-icon"
          >
            <input
              type="radio"
              name="relationship"
              value={value}
              defaultChecked={value === defaultValue}
              className="sr-only"
            />
            {label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
