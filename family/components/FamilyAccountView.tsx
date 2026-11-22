import { AccountView } from "@/account/components/AccountView";
import {
  familyNotificationPreferences,
  type NotificationPreferenceKey,
} from "@/account/notification-preferences";
import { avatarTones } from "@/elderly/avatar-tones";
import { userRoleLabels } from "@/users/user-role-labels";
import { mockFamily } from "../mock-family";
import { buildProfileRelationship } from "../relationship-text";
import { FamilyElderlyCard } from "./FamilyElderlyCard";

type FamilyAccountViewProps = {
  userId: string;
  fullName: string;
  email: string;
  photoUrl: string | null;
  notificationValues: Record<NotificationPreferenceKey, boolean>;
};

export function FamilyAccountView({
  userId,
  fullName,
  email,
  photoUrl,
  notificationValues,
}: FamilyAccountViewProps) {
  return (
    <AccountView
      userId={userId}
      fullName={fullName}
      email={email}
      detail={buildProfileRelationship(mockFamily)}
      roleLabel={userRoleLabels.relative}
      canEdit={false}
      avatarColors={avatarTones.lilac}
      photoUrl={photoUrl}
      preferences={familyNotificationPreferences}
      notificationValues={notificationValues}
    >
      <FamilyElderlyCard elderly={mockFamily.elderly} />
    </AccountView>
  );
}
