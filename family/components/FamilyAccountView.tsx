import type { ReactNode } from "react";
import { AccountView } from "@/account/components/AccountView";
import { avatarTones } from "@/elderly/avatar-tones";
import type { AvatarPermissions } from "@/users/types";
import { userRoleLabels } from "@/users/user-role-labels";
import { buildProfileRelationship } from "../relationship-text";
import type { FamilyAccountElderly } from "../types";
import { FamilyElderlyCard } from "./FamilyElderlyCard";

// own: el familiar en su "Mi cuenta"; admin: el admin viendo el perfil de un familiar
const modeConfig = {
  own: {
    elderlyTitle: "MIS ADULTOS MAYORES",
    emptyText: "Aún no tienes adultos mayores vinculados.",
    showAccountActions: true,
  },
  admin: {
    elderlyTitle: "ADULTOS MAYORES",
    emptyText: "No tiene adultos mayores vinculados.",
    showAccountActions: false,
  },
} as const;

type FamilyAccountViewProps = {
  mode: keyof typeof modeConfig;
  userId: string;
  fullName: string;
  email: string;
  photoUrl: string | null;
  elderly: FamilyAccountElderly[];
  avatarPermissions: AvatarPermissions;
  canEdit: boolean;
  heading?: ReactNode;
};

export function FamilyAccountView({
  mode,
  userId,
  fullName,
  email,
  photoUrl,
  elderly,
  avatarPermissions,
  canEdit,
  heading,
}: FamilyAccountViewProps) {
  const { elderlyTitle, emptyText, showAccountActions } = modeConfig[mode];
  const activeElderly = elderly.filter(({ isArchived }) => !isArchived);

  return (
    <AccountView
      userId={userId}
      fullName={fullName}
      email={email}
      detail={buildProfileRelationship(activeElderly)}
      roleLabel={userRoleLabels.relative}
      canEdit={canEdit}
      avatarPermissions={avatarPermissions}
      heading={heading}
      avatarColors={avatarTones.lilac}
      photoUrl={photoUrl}
      showAccountActions={showAccountActions}
    >
      <FamilyElderlyCard
        title={elderlyTitle}
        emptyText={emptyText}
        elderly={elderly}
      />
    </AccountView>
  );
}
