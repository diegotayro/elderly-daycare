import Link from "next/link";
import { avatarTones } from "@/elderly/avatar-tones";
import { Avatar } from "@/shared/components/Avatar";
import type { FamilyElderly } from "../types";

type ElderlyFilterChipsProps = {
  elderly: Pick<FamilyElderly, "id" | "firstName" | "initial" | "tone">[];
  selectedId: string | null; // null = "Todos"
  onSelect?: (elderlyId: string | null) => void;
  // Con hrefById cada chip es un enlace (filtro por URL) y onSelect no se usa
  hrefById?: Record<string, string>;
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
  hrefById,
  includeAll = false,
}: ElderlyFilterChipsProps) {
  return (
    <div className="mb-[22px] flex flex-wrap gap-2.5">
      {elderly.map(({ id, firstName, initial, tone }) => {
        const className = `${chipBaseClassName} gap-2 py-[7px] pr-[15px] pl-2 ${chipStateClassName(selectedId === id)}`;
        const content = (
          <>
            <Avatar
              initial={initial}
              size={26}
              fontSize={13}
              colors={avatarTones[tone]}
            />
            {firstName}
          </>
        );
        const href = hrefById?.[id];
        return href ? (
          <Link
            key={id}
            href={href}
            aria-current={selectedId === id ? "page" : undefined}
            className={className}
          >
            {content}
          </Link>
        ) : (
          <button
            key={id}
            type="button"
            aria-pressed={selectedId === id}
            onClick={() => onSelect?.(id)}
            className={className}
          >
            {content}
          </button>
        );
      })}
      {includeAll && (
        <button
          type="button"
          aria-pressed={selectedId === null}
          onClick={() => onSelect?.(null)}
          className={`${chipBaseClassName} px-4 py-[7px] ${chipStateClassName(selectedId === null)}`}
        >
          Todos
        </button>
      )}
    </div>
  );
}
