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

export function LinkedRelativeRow({ relative }: LinkedRelativeRowProps) {
  return (
    <div className="flex items-center gap-3">
      <Avatar
        initial={relative.initial}
        size={40}
        fontSize={16}
        colors={avatarTones[relative.tone]}
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
    </div>
  );
}
