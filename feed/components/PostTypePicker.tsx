import type { CSSProperties } from "react";
import type { PostType } from "@/shared/database/types";
import { postTypeStyles } from "../post-type-styles";

const POST_TYPE_ORDER: PostType[] = [
  "meal",
  "nap",
  "activity",
  "achievement",
  "announcement",
];

export function PostTypePicker() {
  return (
    <fieldset className="m-0 min-w-0 border-0 p-0">
      <legend className="mb-2.5 p-0 text-xs font-extrabold tracking-[0.7px] text-muted-strong">
        TIPO
      </legend>
      <div className="flex flex-wrap gap-[9px]">
        {POST_TYPE_ORDER.map((type) => {
          const { label, bg, fg } = postTypeStyles[type];
          return (
            <label
              key={type}
              style={{ "--pill-bg": bg, "--pill-fg": fg } as CSSProperties}
              className="cursor-pointer rounded-full bg-(--pill-bg) px-4 py-2 text-[13.5px] font-extrabold text-(--pill-fg) has-checked:bg-(--pill-fg) has-checked:text-white has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-(--pill-fg)"
            >
              <input
                type="radio"
                name="type"
                value={type}
                className="sr-only"
              />
              {label}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
