import { avatarTones } from "@/elderly/avatar-tones";
import { Avatar } from "@/shared/components/Avatar";
import type { FamilyAccountElderly } from "../types";
import { photoConsentLabel } from "@/elderly/photo-consent-labels";
import { PhotoConsentRequestButton } from "./PhotoConsentRequestButton";

type FamilyElderlyCardProps = {
  title: string; // "MIS ADULTOS MAYORES" | "ADULTOS MAYORES"
  emptyText: string;
  elderly: FamilyAccountElderly[];
  showConsentRequest: boolean; // solo el familiar puede solicitar el cambio
};

export function FamilyElderlyCard({
  title,
  emptyText,
  elderly,
  showConsentRequest,
}: FamilyElderlyCardProps) {
  return (
    <section className="mb-[18px] rounded-[18px] border border-line bg-surface px-[22px] py-[18px]">
      <h2 className="m-0 mb-3.5 text-[12.5px] font-extrabold tracking-[0.8px] text-label">
        {title}
      </h2>
      {elderly.length === 0 ? (
        <p className="m-0 text-sm text-muted">{emptyText}</p>
      ) : (
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
              isArchived,
            }) => (
              <li
                key={id}
                className={`flex flex-wrap items-center gap-x-[13px] gap-y-3 ${isArchived ? "opacity-60" : ""}`}
              >
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
                {isArchived && (
                  <span className="flex-none rounded-full bg-line px-[9px] py-[5px] text-[11px] font-extrabold text-nav">
                    Archivado
                  </span>
                )}
                <div className="flex w-full items-center justify-between gap-3 sm:w-auto">
                  <span className="text-[13px] text-muted-strong">
                    Fotos: {photoConsentLabel(photoConsent)}
                  </span>
                  {showConsentRequest && !isArchived && (
                    <PhotoConsentRequestButton />
                  )}
                </div>
              </li>
            ),
          )}
        </ul>
      )}
    </section>
  );
}
