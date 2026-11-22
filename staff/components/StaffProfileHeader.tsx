import { avatarTones } from "@/elderly/avatar-tones";
import { AvatarPhotoButton } from "@/users/components/AvatarPhotoButton";
import { ChangeAvatarButton } from "@/users/components/ChangeAvatarButton";
import { userRoleLabels } from "@/users/user-role-labels";
import type { StaffProfile } from "../types";
import { StaffStatusActions } from "./StaffStatusActions";

type StaffProfileHeaderProps = {
  profile: StaffProfile;
};

export function StaffProfileHeader({ profile }: StaffProfileHeaderProps) {
  return (
    <div className="flex flex-wrap items-center gap-x-[18px] gap-y-3">
      <AvatarPhotoButton
        userId={profile.id}
        fullName={profile.fullName}
        roleLabel={userRoleLabels.staff}
        canRemove={profile.avatarPermissions.canRemove}
        initial={profile.initial}
        size={84}
        fontSize={34}
        colors={avatarTones[profile.tone]}
        photoUrl={profile.photoUrl}
      />
      <div className="min-w-[180px] flex-1">
        <h1 className="m-0 font-display text-[28px] leading-[normal] font-semibold text-ink">
          {profile.fullName}
        </h1>
        <p className="m-0 mt-[3px] text-[15px] text-muted-strong">Staff</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <StaffStatusActions profile={profile} />
        {profile.avatarPermissions.canChange && (
          <ChangeAvatarButton userId={profile.id} />
        )}
        <button
          type="button"
          className="cursor-pointer rounded-xl border-[1.5px] border-line bg-surface px-4 py-[9px] text-sm font-bold text-nav"
        >
          Editar
        </button>
      </div>
    </div>
  );
}
