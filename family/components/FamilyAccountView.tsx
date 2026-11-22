import { AccountView } from "@/account/components/AccountView";
import { avatarTones } from "@/elderly/avatar-tones";
import { userRoleLabels } from "@/users/user-role-labels";
import { buildProfileRelationship } from "../relationship-text";
import type { FamilyAccountElderly } from "../types";
import { FamilyElderlyCard } from "./FamilyElderlyCard";

type FamilyAccountViewProps = {
  userId: string;
  fullName: string;
  email: string;
  photoUrl: string | null;
  elderly: FamilyAccountElderly[];
};

export function FamilyAccountView({
  userId,
  fullName,
  email,
  photoUrl,
  elderly,
}: FamilyAccountViewProps) {
  const activeElderly = elderly.filter(({ isArchived }) => !isArchived);

  return (
    <AccountView
      userId={userId}
      fullName={fullName}
      email={email}
      detail={buildProfileRelationship(activeElderly)}
      roleLabel={userRoleLabels.relative}
      canEdit={false}
      avatarColors={avatarTones.lilac}
      photoUrl={photoUrl}
    >
      <FamilyElderlyCard
        title="MIS ADULTOS MAYORES"
        emptyText="Aún no tienes adultos mayores vinculados."
        elderly={elderly}
      />
    </AccountView>
  );
}
