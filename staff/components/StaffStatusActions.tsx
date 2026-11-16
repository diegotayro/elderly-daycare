"use client";

import { unstable_rethrow, useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Toast } from "@/shared/components/toast/Toast";
import type { ToastMessage } from "@/shared/components/toast/types";
import { archiveStaff } from "../actions/archive-staff";
import { cancelStaffInvitation } from "../actions/cancel-staff-invitation";
import { deleteStaff } from "../actions/delete-staff";
import { reactivateStaff } from "../actions/reactivate-staff";
import {
  archivedToast,
  archiveErrorToast,
  buildStaffConfirmContent,
  cancelInvitationErrorToast,
  deleteErrorToast,
  hasHistoryToast,
  reactivatedToast,
  reactivateErrorToast,
  type StaffConfirmAction,
} from "../staff-status-messages";
import type { DeleteStaffResult, StaffProfile } from "../types";
import { ConfirmStaffActionDialog } from "./ConfirmStaffActionDialog";
import { ResendInvitationButton } from "./ResendInvitationButton";

const actionClassName =
  "cursor-pointer rounded-xl border-[1.5px] border-line bg-surface px-4 py-[9px] text-sm font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral disabled:cursor-default disabled:opacity-50";
const neutralClassName = `${actionClassName} text-nav`;
const dangerClassName = `${actionClassName} text-[#D9684A]`;

type ConfirmHandler = {
  run: (staffId: string) => Promise<DeleteStaffResult>;
  successToast?: (staffFullName: string) => ToastMessage; // sin toast si la acción redirige
  errorToast: ToastMessage;
};

const confirmHandlers: Record<StaffConfirmAction, ConfirmHandler> = {
  archive: {
    run: archiveStaff,
    successToast: archivedToast,
    errorToast: archiveErrorToast,
  },
  "cancel-invitation": {
    run: cancelStaffInvitation,
    errorToast: cancelInvitationErrorToast,
  },
  delete: { run: deleteStaff, errorToast: deleteErrorToast },
};

type StaffStatusActionsProps = {
  profile: StaffProfile;
};

export function StaffStatusActions({ profile }: StaffStatusActionsProps) {
  const router = useRouter();
  const [openAction, setOpenAction] = useState<StaffConfirmAction | null>(null);
  const [isReactivating, startReactivating] = useTransition();
  // La key reinicia el temporizador cuando un toast reemplaza a otro
  const [toast, setToast] = useState<{
    id: number;
    message: ToastMessage;
  } | null>(null);

  function showToast(message: ToastMessage) {
    setToast((current) => ({ id: (current?.id ?? 0) + 1, message }));
  }

  async function confirm(): Promise<boolean> {
    if (!openAction) return false;
    const handler = confirmHandlers[openAction];
    const result = await handler
      .run(profile.id)
      .catch((error: unknown): DeleteStaffResult => {
        // Si la acción redirige, Next rechaza la promesa: no es un fallo
        unstable_rethrow(error);
        return { status: "error" }; // fallo de red
      });

    if (result.status === "success") {
      if (handler.successToast)
        showToast(handler.successToast(profile.fullName));
      return true;
    }
    if (result.status === "has-history") {
      showToast(hasHistoryToast);
      router.refresh();
      return true;
    }
    showToast(handler.errorToast);
    return false;
  }

  function reactivate() {
    startReactivating(async () => {
      const result = await reactivateStaff(profile.id).catch(
        (): DeleteStaffResult => ({ status: "error" }), // fallo de red
      );
      showToast(
        result.status === "success"
          ? reactivatedToast(profile.fullName)
          : reactivateErrorToast,
      );
    });
  }

  return (
    <>
      {profile.canResendInvitation && (
        <ResendInvitationButton staffId={profile.id} email={profile.email} />
      )}
      {profile.canCancelInvitation && (
        <button
          type="button"
          onClick={() => setOpenAction("cancel-invitation")}
          className={dangerClassName}
        >
          Cancelar invitación
        </button>
      )}
      {profile.canArchive && (
        <button
          type="button"
          onClick={() => setOpenAction("archive")}
          className={neutralClassName}
        >
          Archivar
        </button>
      )}
      {profile.canReactivate && (
        <button
          type="button"
          onClick={reactivate}
          disabled={isReactivating}
          className={neutralClassName}
        >
          {isReactivating ? "Reactivando…" : "Reactivar"}
        </button>
      )}
      {profile.canDelete && (
        <button
          type="button"
          onClick={() => setOpenAction("delete")}
          className={dangerClassName}
        >
          Eliminar
        </button>
      )}
      <ConfirmStaffActionDialog
        content={
          openAction && buildStaffConfirmContent(openAction, profile.fullName)
        }
        uncoveredElderly={profile.uncoveredElderly}
        onConfirm={confirm}
        onClose={() => setOpenAction(null)}
      />
      {toast && (
        <Toast
          key={toast.id}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
}
