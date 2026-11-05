import Link from "next/link";
import { PlusIcon } from "@/shared/components/icons/PlusIcon";
import type { LinkedRelative } from "../types";
import { LinkedRelativeRow } from "./LinkedRelativeRow";

type LinkedRelativesCardProps = {
  relatives: LinkedRelative[];
};

export function LinkedRelativesCard({ relatives }: LinkedRelativesCardProps) {
  return (
    <section className="rounded-2xl border border-line bg-surface px-[18px] py-4">
      <h2 className="m-0 mb-3.5 text-[12.5px] font-extrabold tracking-[0.8px] text-label">
        FAMILIARES VINCULADOS
      </h2>
      <div className="flex flex-col gap-3.5">
        {relatives.map((relative) => (
          <LinkedRelativeRow key={relative.id} relative={relative} />
        ))}
        <Link href="/" className="flex items-center gap-3 pt-2">
          <span className="flex size-10 flex-none items-center justify-center rounded-full border-[1.5px] border-dashed border-[#D8CBBA] text-photo-ink">
            <PlusIcon size={18} strokeWidth={2.2} />
          </span>
          <span className="text-[14.5px] font-extrabold text-coral-link">
            Vincular otro familiar/tutor
          </span>
        </Link>
      </div>
    </section>
  );
}
