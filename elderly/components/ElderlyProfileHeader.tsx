import { Avatar } from "@/shared/components/Avatar";
import { avatarTones } from "../avatar-tones";
import type { ElderlyProfile } from "../types";
import { EditElderlyDialog } from "./EditElderlyDialog";
import { ElderlyStatusActions } from "./ElderlyStatusActions";

type ElderlyProfileHeaderProps = {
  profile: ElderlyProfile;
};

export function ElderlyProfileHeader({ profile }: ElderlyProfileHeaderProps) {
  return (
    <div className="flex flex-wrap items-center gap-x-[18px] gap-y-3">
      <Avatar
        initial={profile.initial}
        size={84}
        fontSize={34}
        colors={avatarTones[profile.tone]}
      />
      <div className="min-w-[200px] flex-1">
        <h1 className="m-0 font-display text-[28px] leading-[normal] font-semibold text-ink">
          {profile.fullName}
        </h1>
        <div className="mt-[3px] flex flex-wrap items-center gap-x-2.5 gap-y-1">
          <p className="m-0 text-[15px] text-muted-strong">
            {profile.subtitle}
          </p>
          {profile.isArchived && (
            <span className="flex-none rounded-full bg-line px-[9px] py-1 text-[10.5px] font-extrabold text-nav">
              ARCHIVADO
            </span>
          )}
        </div>
      </div>
      <div className="flex flex-wrap justify-end gap-2">
        {profile.canEdit && (
          <EditElderlyDialog
            elderlyId={profile.id}
            editValues={profile.editValues}
            roomOptions={profile.roomOptions}
            today={profile.today}
          />
        )}
        <ElderlyStatusActions profile={profile} />
      </div>
    </div>
  );
}
