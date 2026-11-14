import { avatarTones } from "@/elderly/avatar-tones";
import { Avatar } from "@/shared/components/Avatar";
import { CloseIcon } from "@/shared/components/icons/CloseIcon";
import type { LinkedElderly } from "../types";

type LinkedElderlyRowProps = {
  elderly: LinkedElderly;
  canUnlink: boolean;
};

const statusBadgeClassNames: Record<LinkedElderly["status"], string> = {
  active: "bg-[#CFEBD8] text-[#3E9B6C]",
  archived: "bg-line text-nav",
};

export function LinkedElderlyRow({
  elderly,
  canUnlink,
}: LinkedElderlyRowProps) {
  const unlinkLabel = `Desvincular a ${elderly.fullName}`;

  return (
    <div className="flex items-center gap-3">
      <Avatar
        initial={elderly.initial}
        size={40}
        fontSize={16}
        colors={avatarTones[elderly.tone]}
      />
      <div className="min-w-0 flex-1">
        <div className="text-[14.5px] font-extrabold text-ink">
          {elderly.fullName}
        </div>
        <div className="text-[12.5px] text-muted">{elderly.detail}</div>
      </div>
      <span
        className={`flex-none rounded-full px-[9px] py-1 text-[10.5px] font-extrabold ${statusBadgeClassNames[elderly.status]}`}
      >
        {elderly.statusLabel}
      </span>
      {canUnlink && (
        <button
          type="button"
          aria-label={unlinkLabel}
          title={unlinkLabel}
          className="flex size-8 flex-none cursor-pointer items-center justify-center rounded-lg text-[#D9684A] hover:bg-[#FBD8CC] focus-visible:bg-[#FBD8CC] focus-visible:outline-2 focus-visible:outline-[#D9684A]"
        >
          <CloseIcon size={16} />
        </button>
      )}
    </div>
  );
}
