import { AccountView } from "@/account/components/AccountView";
import {
  familyNotificationPreferences,
  type NotificationPreferenceKey,
} from "@/account/notification-preferences";
import { avatarTones } from "@/elderly/avatar-tones";
import { mockFamily } from "../mock-family";
import { buildProfileRelationship } from "../relationship-text";
import { FamilyElderlyCard } from "./FamilyElderlyCard";

type FamilyAccountViewProps = {
  fullName: string;
  email: string;
  photoUrl: string | null;
  notificationValues: Record<NotificationPreferenceKey, boolean>;
};

export function FamilyAccountView({
  fullName,
  email,
  photoUrl,
  notificationValues,
}: FamilyAccountViewProps) {
  return (
    <AccountView
      fullName={fullName}
      email={email}
      detail={buildProfileRelationship(mockFamily)}
      avatarColors={avatarTones.lilac}
      photoUrl={photoUrl}
      preferences={familyNotificationPreferences}
      notificationValues={notificationValues}
    >
      <FamilyElderlyCard elderly={mockFamily.elderly} />
    </AccountView>
  );
}
