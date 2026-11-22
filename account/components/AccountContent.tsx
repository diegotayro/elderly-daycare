import { requireTeamUser } from "@/auth/require-user";
import { EditUserDialog } from "@/users/components/EditUserDialog";
import { OWN_AVATAR_PERMISSIONS } from "@/users/avatar-permissions";
import { getCurrentUserPhotoUrl } from "@/users/get-current-user-photo-url";
import { userRoleLabels } from "@/users/user-role-labels";
import { updateOwnProfile } from "../actions/update-own-profile";
import { teamNotificationPreferences } from "../notification-preferences";
import { AccountView } from "./AccountView";

export async function AccountContent() {
  const user = await requireTeamUser();
  const photoUrl = await getCurrentUserPhotoUrl();

  return (
    <AccountView
      userId={user.id}
      fullName={user.full_name}
      email={user.email}
      detail={userRoleLabels[user.role]}
      roleLabel={userRoleLabels[user.role]}
      editAction={
        user.role === "admin" && (
          <EditUserDialog
            title="Editar perfil"
            initialValues={{
              firstName: user.first_name,
              lastName: user.last_name,
            }}
            successDescription="Actualizamos tu perfil."
            onSave={updateOwnProfile}
          />
        )
      }
      avatarPermissions={OWN_AVATAR_PERMISSIONS}
      photoUrl={photoUrl}
      notifications={{
        preferences: teamNotificationPreferences,
        values: {
          notify_on_post: user.notify_on_post,
          daily_summary_enabled: user.daily_summary_enabled,
        },
      }}
    />
  );
}
