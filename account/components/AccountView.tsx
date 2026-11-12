import type { ReactNode } from "react";
import type {
  NotificationPreference,
  NotificationPreferenceKey,
} from "../notification-preferences";
import { SignOutForm } from "@/auth/components/SignOutForm";
import { AccountActionsCard } from "./AccountActionsCard";
import { AccountTitle } from "./AccountTitle";
import { NotificationSettingsCard } from "./NotificationSettingsCard";
import { ProfileCard } from "./ProfileCard";

type AccountViewProps = {
  fullName: string;
  email: string;
  detail: string;
  avatarColors?: { bg: string; fg: string };
  preferences: NotificationPreference[];
  notificationValues: Record<NotificationPreferenceKey, boolean>;
  children?: ReactNode; // entre el perfil y las notificaciones
};

export function AccountView({
  fullName,
  email,
  detail,
  avatarColors,
  preferences,
  notificationValues,
  children,
}: AccountViewProps) {
  return (
    <div className="mx-auto w-full max-w-[680px] px-4 pt-5 pb-8 lg:px-10 lg:pt-[34px] lg:pb-20">
      <header className="mb-[22px]">
        <AccountTitle />
      </header>
      <ProfileCard
        fullName={fullName}
        email={email}
        detail={detail}
        avatarColors={avatarColors}
      />
      {children}
      <NotificationSettingsCard
        preferences={preferences}
        initialValues={notificationValues}
      />
      <AccountActionsCard />
      <SignOutForm className="block w-full cursor-pointer rounded-[14px] border-[1.5px] border-logout-line bg-logout-bg p-3.5 text-center text-[15px] font-extrabold text-coral-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral-strong">
        Cerrar sesión
      </SignOutForm>
    </div>
  );
}
