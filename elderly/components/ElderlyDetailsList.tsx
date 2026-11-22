import { DetailsList } from "@/shared/components/DetailsList";
import { photoConsentLabel } from "../photo-consent-labels";
import type { ElderlyProfile } from "../types";
import { PhotoConsentToggle } from "./PhotoConsentToggle";

type ElderlyDetailsListProps = {
  profile: ElderlyProfile;
};

export function ElderlyDetailsList({ profile }: ElderlyDetailsListProps) {
  return (
    <DetailsList
      details={[
        { label: "Fecha de nacimiento", value: profile.birthDateLabel },
        { label: "Habitación", value: profile.roomName },
        { label: "Ingreso", value: profile.enrolledAtLabel },
        {
          label: "Fotos",
          value: profile.canEditPhotoConsent ? (
            <PhotoConsentToggle
              elderlyId={profile.id}
              initialAllowed={profile.photoConsent}
            />
          ) : (
            photoConsentLabel(profile.photoConsent)
          ),
        },
      ]}
    />
  );
}
