import type { ReactNode } from "react";
import { AvatarPhotoButton } from "@/users/components/AvatarPhotoButton";
import { ChangeAvatarButton } from "@/users/components/ChangeAvatarButton";
import type { AvatarPermissions } from "@/users/types";

type ProfileCardProps = {
  userId: string;
  avatarColors?: { bg: string; fg: string };
  photoUrl?: string | null;
  avatarPermissions: AvatarPermissions;
  fullName: string;
  email: string;
  detail: string; // parentesco o rol, bajo el email
  roleLabel: string; // subtítulo del visor del avatar
  editAction?: ReactNode; // botón "Editar" con su modal; sin él no hay edición
};

export function ProfileCard({
  userId,
  fullName,
  email,
  detail,
  roleLabel,
  avatarColors,
  photoUrl,
  avatarPermissions,
  editAction,
}: ProfileCardProps) {
  const hasActions = avatarPermissions.canChange || editAction;

  return (
    <section className="mb-[18px] flex flex-wrap items-center gap-x-[18px] gap-y-3.5 rounded-[18px] border border-line bg-surface px-[22px] py-5">
      <AvatarPhotoButton
        userId={userId}
        fullName={fullName}
        roleLabel={roleLabel}
        canRemove={avatarPermissions.canRemove}
        initial={fullName[0]}
        size={64}
        fontSize={26}
        colors={avatarColors}
        photoUrl={photoUrl}
      />
      <div className="min-w-0 flex-1 basis-[180px]">
        <div className="font-display text-xl leading-[normal] font-semibold text-ink">
          {fullName}
        </div>
        <div className="text-sm leading-[normal] break-words text-muted-strong">
          {email}
        </div>
        <div className="mt-0.5 text-[13px] leading-[normal] text-muted">
          {detail}
        </div>
      </div>
      {hasActions && (
        <div className="flex flex-wrap gap-2">
          {avatarPermissions.canChange && <ChangeAvatarButton userId={userId} />}
          {editAction}
        </div>
      )}
    </section>
  );
}
