"use client";

import { useRef, useState, type ComponentProps } from "react";
import { PhotoViewer } from "@/feed/components/PhotoViewer";
import {
  VIEWER_BUTTON_CIRCLE_CLASS_NAME,
  VIEWER_BUTTON_CLASS_NAME,
} from "@/feed/components/PhotoDownloadButton";
import { Avatar } from "@/shared/components/Avatar";
import { TrashIcon } from "@/shared/components/icons/TrashIcon";
import { Toast } from "@/shared/components/toast/Toast";
import { removeAvatar } from "../actions/remove-avatar";
import { avatarMessages } from "../avatar-messages";
import type { AvatarActionResult } from "../types";
import { RemoveAvatarDialog } from "./RemoveAvatarDialog";

type AvatarPhotoButtonProps = ComponentProps<typeof Avatar> & {
  userId: string;
  fullName: string;
  roleLabel: string;
  canRemove: boolean;
};

// Sin red la Server Action lanza en vez de devolver "error": se trata igual
async function tryRemoveAvatar(userId: string): Promise<AvatarActionResult> {
  try {
    return await removeAvatar(userId);
  } catch {
    return { status: "error" };
  }
}

// Con foto, el avatar abre el visor; sin foto es solo el avatar (no recibe foco ni clic)
export function AvatarPhotoButton({
  userId,
  fullName,
  roleLabel,
  canRemove,
  ...avatarProps
}: AvatarPhotoButtonProps) {
  const { photoUrl } = avatarProps;
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  // La key reinicia el temporizador si el toast se repite
  const [errorToastId, setErrorToastId] = useState<number | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  if (!photoUrl) return <Avatar {...avatarProps} />;

  // Safari no enfoca el botón al hacer clic: el foco vuelve al avatar que abrió el visor
  function closeViewer() {
    setIsViewerOpen(false);
    triggerRef.current?.focus();
  }

  async function confirmRemove(): Promise<boolean> {
    const result = await tryRemoveAvatar(userId);
    if (result.status === "ok") {
      setIsViewerOpen(false);
    } else {
      // El diálogo se cierra y el error se ve en el visor, que sigue abierto
      setErrorToastId((id) => (id ?? 0) + 1);
    }
    return true;
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label={avatarMessages.viewPhotoLabel(fullName)}
        onClick={() => setIsViewerOpen(true)}
        className="flex-none cursor-pointer rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral-strong"
      >
        <Avatar {...avatarProps} />
      </button>
      {isViewerOpen && (
        <PhotoViewer
          photos={[{ url: photoUrl, width: null, height: null }]}
          initialIndex={0}
          heading={fullName}
          subtitle={roleLabel}
          renderHeaderAction={() =>
            canRemove && (
              <>
                <button
                  type="button"
                  aria-label={avatarMessages.removeButton}
                  title={avatarMessages.removeButton}
                  onClick={() => setIsConfirmOpen(true)}
                  className={VIEWER_BUTTON_CLASS_NAME}
                >
                  <span className={VIEWER_BUTTON_CIRCLE_CLASS_NAME}>
                    <TrashIcon size={19} />
                  </span>
                </button>
                {errorToastId !== null && (
                  <Toast
                    key={errorToastId}
                    message={avatarMessages.removeErrorToast}
                    onClose={() => setErrorToastId(null)}
                  />
                )}
              </>
            )
          }
          onClose={closeViewer}
        />
      )}
      <RemoveAvatarDialog
        isOpen={isConfirmOpen}
        onConfirm={confirmRemove}
        onClose={() => setIsConfirmOpen(false)}
      />
    </>
  );
}
