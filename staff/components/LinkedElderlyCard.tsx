import { PlusIcon } from "@/shared/components/icons/PlusIcon";
import type { LinkedElderly } from "../types";
import { LinkedElderlyRow } from "./LinkedElderlyRow";

type LinkedElderlyCardProps = {
  linkedElderly: LinkedElderly[];
  canManageLinks: boolean;
};

export function LinkedElderlyCard({
  linkedElderly,
  canManageLinks,
}: LinkedElderlyCardProps) {
  return (
    <section className="rounded-2xl border border-line bg-surface px-[18px] py-4">
      <h2 className="m-0 mb-3.5 text-[12.5px] font-extrabold tracking-[0.8px] text-label">
        ADULTOS MAYORES VINCULADOS
      </h2>
      <div className="flex flex-col gap-3.5">
        {linkedElderly.length === 0 && (
          <p className="m-0 text-[14.5px] text-muted-strong">
            Todavía no hay adultos mayores vinculados.
          </p>
        )}
        {linkedElderly.map((elderly) => (
          <LinkedElderlyRow
            key={elderly.linkId}
            elderly={elderly}
            canUnlink={canManageLinks}
          />
        ))}
        {canManageLinks && (
          <button
            type="button"
            className="flex cursor-pointer items-center gap-3 pt-2 text-left"
          >
            <span className="flex size-10 flex-none items-center justify-center rounded-full border-[1.5px] border-dashed border-[#D8CBBA] text-photo-ink">
              <PlusIcon size={18} strokeWidth={2.2} />
            </span>
            <span className="text-[14.5px] font-extrabold text-coral-link">
              Vincular otro adulto mayor
            </span>
          </button>
        )}
      </div>
    </section>
  );
}
