import {
  notificationPreferences,
  type NotificationPreferenceKey,
} from "../notification-preferences";
import { NotificationToggle } from "./NotificationToggle";

type NotificationSettingsCardProps = {
  initialValues: Record<NotificationPreferenceKey, boolean>;
};

export function NotificationSettingsCard({
  initialValues,
}: NotificationSettingsCardProps) {
  return (
    <section className="mb-[18px] rounded-[18px] border border-line bg-surface px-[22px] py-[18px]">
      <h2 className="m-0 mb-3.5 text-[12.5px] font-extrabold tracking-[0.8px] text-label">
        NOTIFICACIONES
      </h2>
      {notificationPreferences.map(({ key, label }) => (
        <NotificationToggle
          key={key}
          label={label}
          initialEnabled={initialValues[key]}
        />
      ))}
    </section>
  );
}
