import { DetailsList } from "@/shared/components/DetailsList";
import type { ElderlyProfile } from "../types";

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
      ]}
    />
  );
}
