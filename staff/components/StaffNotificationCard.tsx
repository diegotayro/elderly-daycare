import { NotificationSettingsCard } from "@/account/components/NotificationSettingsCard";
import {
  teamNotificationPreferences,
  type NotificationPreferenceKey,
} from "@/account/notification-preferences";

type StaffNotificationCardProps = {
  staffId: string;
  values: Record<NotificationPreferenceKey, boolean>;
};

// Las mismas preferencias que el staff ve en su "Mi cuenta"; el admin las cambia por él
export function StaffNotificationCard({
  staffId,
  values,
}: StaffNotificationCardProps) {
  return (
    <NotificationSettingsCard
      userId={staffId}
      preferences={teamNotificationPreferences}
      initialValues={values}
    />
  );
}
