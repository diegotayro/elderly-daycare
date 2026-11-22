import type { ReactNode } from "react";
import type {
  NotificationPreference,
  NotificationPreferenceKey,
} from "../notification-preferences";
import { SignOutForm } from "@/auth/components/SignOutForm";
import type { AvatarPermissions } from "@/users/types";
import { AccountActionsCard } from "./AccountActionsCard";
import { AccountTitle } from "./AccountTitle";
import { NotificationSettingsCard } from "./NotificationSettingsCard";
import { ProfileCard } from "./ProfileCard";

// En "Mi cuenta" cada usuario gestiona su propia foto
const OWN_AVATAR_PERMISSIONS: AvatarPermissions = {
  canChange: true,
  canRemove: true,
};

type AccountViewProps = {
  userId: string;
  fullName: string;
  email: string;
  detail: string;
  roleLabel: string;
  canEdit: boolean; // "Editar" del perfil; solo el admin en su /account
  avatarColors?: { bg: string; fg: string };
  photoUrl?: string | null;
  preferences: NotificationPreference[];
  notificationValues: Record<NotificationPreferenceKey, boolean>;
  children?: ReactNode; // entre el perfil y las notificaciones
};

export function AccountView({
  userId,
  fullName,
  email,
  detail,
  roleLabel,
  canEdit,
  avatarColors,
  photoUrl,
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
        userId={userId}
        fullName={fullName}
        email={email}
        detail={detail}
        roleLabel={roleLabel}
        canEdit={canEdit}
        avatarPermissions={OWN_AVATAR_PERMISSIONS}
        avatarColors={avatarColors}
        photoUrl={photoUrl}
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
