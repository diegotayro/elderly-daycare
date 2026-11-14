import { avatarTones } from "@/elderly/avatar-tones";
import { Avatar } from "@/shared/components/Avatar";
import type { StaffProfile } from "../types";

type StaffProfileHeaderProps = {
  profile: StaffProfile;
};

export function StaffProfileHeader({ profile }: StaffProfileHeaderProps) {
  return (
    <div className="flex items-center gap-[18px]">
      <Avatar
        initial={profile.initial}
        size={84}
        fontSize={34}
        colors={avatarTones[profile.tone]}
      />
      <div className="min-w-0 flex-1">
        <h1 className="m-0 font-display text-[28px] leading-[normal] font-semibold text-ink">
          {profile.fullName}
        </h1>
        <p className="m-0 mt-[3px] text-[15px] text-muted-strong">Staff</p>
      </div>
      <button
        type="button"
        className="cursor-pointer rounded-xl border-[1.5px] border-line bg-surface px-4 py-[9px] text-sm font-bold text-nav"
      >
        Editar
      </button>
    </div>
  );
}
