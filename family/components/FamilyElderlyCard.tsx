import { avatarTones } from "@/elderly/avatar-tones";
import { Avatar } from "@/shared/components/Avatar";
import type { FamilyElderly } from "../types";
import { PhotoConsentIndicator } from "./PhotoConsentIndicator";

type FamilyElderlyCardProps = {
  elderly: FamilyElderly[];
};

export function FamilyElderlyCard({ elderly }: FamilyElderlyCardProps) {
  return (
    <section className="mb-[18px] rounded-[18px] border border-line bg-surface px-[22px] py-[18px]">
      <h2 className="m-0 mb-3.5 text-[12.5px] font-extrabold tracking-[0.8px] text-label">
        MIS ADULTOS MAYORES
      </h2>
      <ul className="m-0 flex list-none flex-col gap-4 p-0">
        {elderly.map(
          ({
            id,
            fullName,
            initial,
            tone,
            ageLabel,
            roomName,
            photoConsent,
          }) => (
            <li key={id} className="flex items-center gap-[13px]">
              <Avatar
                initial={initial}
                size={42}
                fontSize={16}
                colors={avatarTones[tone]}
              />
              <div className="min-w-0 flex-1">
                <div className="text-[15px] font-extrabold text-ink">
                  {fullName}
                </div>
                <div className="text-[13px] text-muted">
                  {ageLabel} · Habitación {roomName}
                </div>
              </div>
              <span className="text-[13px] text-muted-strong">Fotos</span>
              <PhotoConsentIndicator allowed={photoConsent} />
            </li>
          ),
        )}
      </ul>
    </section>
  );
}
