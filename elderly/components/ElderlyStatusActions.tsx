"use client";

import { useState, useTransition } from "react";
import { ConfirmDialog } from "@/shared/components/ConfirmDialog";
import { Toast } from "@/shared/components/toast/Toast";
import type { ToastMessage } from "@/shared/components/toast/types";
import { archiveElderly } from "../actions/archive-elderly";
import { reactivateElderly } from "../actions/reactivate-elderly";
import {
  archivedToast,
  archiveErrorToast,
  buildArchiveConfirmContent,
  reactivatedToast,
  reactivateErrorToast,
} from "../elderly-status-messages";
import type { ElderlyProfile, ElderlyStatusResult } from "../types";

const buttonClassName =
  "cursor-pointer rounded-xl border-[1.5px] border-line bg-surface px-4 py-[9px] text-sm font-bold text-nav focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral disabled:cursor-default disabled:opacity-50";

const networkError = (): ElderlyStatusResult => ({ status: "error" });

type ElderlyStatusActionsProps = {
  profile: Pick<
    ElderlyProfile,
    "id" | "fullName" | "canArchive" | "canReactivate"
  >;
};

export function ElderlyStatusActions({ profile }: ElderlyStatusActionsProps) {
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);
  const [isReactivating, startReactivating] = useTransition();
  // La key reinicia el temporizador cuando un toast reemplaza a otro
  const [toast, setToast] = useState<{
    id: number;
    message: ToastMessage;
  } | null>(null);

  function showToast(message: ToastMessage) {
    setToast((current) => ({ id: (current?.id ?? 0) + 1, message }));
  }

  async function archive(): Promise<boolean> {
    const result = await archiveElderly(profile.id).catch(networkError);
    if (result.status === "success") {
      showToast(archivedToast(profile.fullName));
      return true;
    }
    showToast(archiveErrorToast);
    return false;
  }

  function reactivate() {
    startReactivating(async () => {
      const result = await reactivateElderly(profile.id).catch(networkError);
      showToast(
        result.status === "success"
          ? reactivatedToast(profile.fullName)
          : reactivateErrorToast,
      );
    });
  }

  return (
    <>
      {profile.canArchive && (
        <button
          type="button"
          onClick={() => setIsArchiveOpen(true)}
          className={buttonClassName}
        >
          Archivar
        </button>
      )}
      {profile.canReactivate && (
        <button
          type="button"
          onClick={reactivate}
          disabled={isReactivating}
          className={buttonClassName}
        >
          {isReactivating ? "Reactivando…" : "Reactivar"}
        </button>
      )}
      <ConfirmDialog
        content={
          isArchiveOpen ? buildArchiveConfirmContent(profile.fullName) : null
        }
        onConfirm={archive}
        onClose={() => setIsArchiveOpen(false)}
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
