import { avatarTones } from "@/elderly/avatar-tones";
import { Avatar } from "@/shared/components/Avatar";
import type { InvitationPreview } from "../types";

type InvitationCardProps = {
  invitation: InvitationPreview;
};

export function InvitationCard({ invitation }: InvitationCardProps) {
  return (
    <div className="mb-[22px] flex items-center gap-3.5 rounded-2xl border-[1.5px] border-field-line bg-white px-4 py-3.5">
      <Avatar
        initial={invitation.elderlyInitial}
        size={44}
        fontSize={19}
        colors={avatarTones[invitation.elderlyTone]}
      />
      <div>
        <div className="text-[13px] text-muted-strong">
          Te invitaron a seguir a
        </div>
        <div className="font-display text-[17px] font-semibold text-ink">
          {invitation.elderlyFullName} · Habitación {invitation.roomName}
        </div>
      </div>
    </div>
  );
}
