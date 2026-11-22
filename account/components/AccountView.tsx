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

type AccountViewProps = {
  userId: string;
  fullName: string;
  email: string;
  detail: string;
  roleLabel: string;
  canEdit: boolean; // "Editar" del perfil
  avatarPermissions: AvatarPermissions;
  heading?: ReactNode; // por defecto, el título "Mi cuenta"
  avatarColors?: { bg: string; fg: string };
  photoUrl?: string | null;
  // Sin notificaciones no se muestra la tarjeta (/family/account)
  notifications?: {
    preferences: NotificationPreference[];
    values: Record<NotificationPreferenceKey, boolean>;
  };
  showAccountActions?: boolean; // "Cambiar contraseña", "Ayuda y soporte" y "Cerrar sesión"
  children?: ReactNode; // entre el perfil y las notificaciones
};

export function AccountView({
  userId,
  fullName,
  email,
  detail,
  roleLabel,
  canEdit,
  avatarPermissions,
  heading = <AccountTitle />,
  avatarColors,
  photoUrl,
  notifications,
  showAccountActions = true,
  children,
}: AccountViewProps) {
  return (
    <div className="mx-auto w-full max-w-[680px] px-4 pt-5 pb-8 lg:px-10 lg:pt-[34px] lg:pb-20">
      <header className="mb-[22px]">{heading}</header>
      <ProfileCard
        userId={userId}
        fullName={fullName}
        email={email}
        detail={detail}
        roleLabel={roleLabel}
        canEdit={canEdit}
        avatarPermissions={avatarPermissions}
        avatarColors={avatarColors}
        photoUrl={photoUrl}
      />
      {children}
      {notifications && (
        <NotificationSettingsCard
          preferences={notifications.preferences}
          initialValues={notifications.values}
        />
      )}
      {showAccountActions && (
        <>
          <AccountActionsCard />
          <SignOutForm className="block w-full cursor-pointer rounded-[14px] border-[1.5px] border-logout-line bg-logout-bg p-3.5 text-center text-[15px] font-extrabold text-coral-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral-strong">
            Cerrar sesión
          </SignOutForm>
        </>
      )}
    </div>
  );
}
