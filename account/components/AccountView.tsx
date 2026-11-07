import type { NotificationPreferenceKey } from "../notification-preferences";
import { NotificationSettingsCard } from "./NotificationSettingsCard";
import { ProfileCard } from "./ProfileCard";

type AccountViewProps = {
  fullName: string;
  email: string;
  roleLabel: string;
  notificationValues: Record<NotificationPreferenceKey, boolean>;
};

export function AccountView({
  fullName,
  email,
  roleLabel,
  notificationValues,
}: AccountViewProps) {
  return (
    <div className="mx-auto w-full max-w-[680px] px-4 pt-5 pb-8 lg:px-10 lg:pt-[34px] lg:pb-20">
      <header className="mb-[22px]">
        <div className="mb-1 text-[12.5px] font-extrabold tracking-[0.8px] text-coral-strong">
          AJUSTES
        </div>
        <h1 className="m-0 font-display text-2xl leading-[normal] font-semibold text-ink lg:text-[30px]">
          Mi cuenta
        </h1>
      </header>
      <ProfileCard fullName={fullName} email={email} roleLabel={roleLabel} />
      <NotificationSettingsCard initialValues={notificationValues} />
    </div>
  );
}
