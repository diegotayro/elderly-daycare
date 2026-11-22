import Link from "next/link";
import { Avatar } from "@/shared/components/Avatar";
import { avatarTones } from "../avatar-tones";
import type { LinkedRelative } from "../types";

type LinkedRelativeRowProps = {
  relative: LinkedRelative;
};

const statusBadgeClassNames: Record<LinkedRelative["status"], string> = {
  active: "bg-[#CFEBD8] text-[#3E9B6C]",
  pending: "bg-[#F7E7A6] text-[#9A7B1E]",
};

const ROW_CLASS_NAME = "flex items-center gap-3";

// Margen negativo: el área de foco y de hover queda un poco más grande que la fila, sin moverla
const LINK_CLASS_NAME = `${ROW_CLASS_NAME} -m-1.5 rounded-xl p-1.5 transition-colors hover:bg-cream focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-coral-strong motion-reduce:transition-none`;

export function LinkedRelativeRow({ relative }: LinkedRelativeRowProps) {
  const content = (
    <>
      <Avatar
        initial={relative.initial}
        size={40}
        fontSize={16}
        colors={avatarTones[relative.tone]}
        photoUrl={relative.photoUrl}
      />
      <div className="min-w-0 flex-1">
        <div className="text-[14.5px] font-extrabold text-ink">
          {relative.fullName}
        </div>
        <div className="text-[12.5px] text-muted">{relative.detail}</div>
      </div>
      <span
        className={`flex-none rounded-full px-[9px] py-1 text-[10.5px] font-extrabold ${statusBadgeClassNames[relative.status]}`}
      >
        {relative.statusLabel}
      </span>
    </>
  );

  if (!relative.profileHref)
    return <div className={ROW_CLASS_NAME}>{content}</div>;

  return (
    <Link href={relative.profileHref} className={LINK_CLASS_NAME}>
      {content}
    </Link>
  );
}
