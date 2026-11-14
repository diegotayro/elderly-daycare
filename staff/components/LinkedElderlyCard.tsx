"use client";

import { useRef, useState } from "react";
import { Toast } from "@/shared/components/toast/Toast";
import type { ToastMessage } from "@/shared/components/toast/types";
import { linkElderlyToStaff } from "../actions/link-elderly-to-staff";
import { unlinkElderlyFromStaff } from "../actions/unlink-elderly-from-staff";
import type { ElderlyOption, LinkedElderly } from "../types";
import { LinkElderlyDialog } from "./LinkElderlyDialog";
import { LinkedElderlyRow } from "./LinkedElderlyRow";
import { UnlinkElderlyDialog } from "./UnlinkElderlyDialog";

type LinkedElderlyCardProps = {
  staffId: string;
  staffFullName: string;
  linkedElderly: LinkedElderly[];
  availableElderly: ElderlyOption[];
  canManageLinks: boolean;
};

const errorToast: ToastMessage = {
  tone: "error",
  title: "No pudimos guardar los cambios",
  description: "Inténtalo de nuevo.",
};

function unlinkedToast(elderlyName: string, staffName: string): ToastMessage {
  return {
    tone: "success",
    title: "Adulto mayor desvinculado",
    description: `${elderlyName} ya no está vinculado a ${staffName}.`,
  };
}

function linkedToast(count: number, staffName: string): ToastMessage {
  const noun =
    count === 1
      ? "1 adulto mayor vinculado"
      : `${count} adultos mayores vinculados`;
  return {
    tone: "success",
    title: "Adultos mayores vinculados",
    description: `${noun} a ${staffName}.`,
  };
}

export function LinkedElderlyCard({
  staffId,
  staffFullName,
  linkedElderly,
  availableElderly,
  canManageLinks,
}: LinkedElderlyCardProps) {
  const [pendingUnlink, setPendingUnlink] = useState<LinkedElderly | null>(
    null,
  );
  // La key reinicia el temporizador cuando un toast reemplaza a otro
  const [toast, setToast] = useState<{
    id: number;
    message: ToastMessage;
  } | null>(null);
  const linkTriggerRef = useRef<HTMLButtonElement>(null);

  function showToast(message: ToastMessage) {
    setToast((current) => ({ id: (current?.id ?? 0) + 1, message }));
  }

  // true si se guardó: el diálogo se cierra solo en ese caso
  async function unlink(elderly: LinkedElderly): Promise<boolean> {
    const result = await unlinkElderlyFromStaff(elderly.linkId);
    if (result.status === "error") {
      showToast(errorToast);
      return false;
    }
    showToast(unlinkedToast(elderly.fullName, staffFullName));
    return true;
  }

  async function link(selected: ElderlyOption[]): Promise<boolean> {
    const result = await linkElderlyToStaff(
      staffId,
      selected.map((option) => option.id),
    );
    if (result.status === "error") {
      showToast(errorToast);
      return false;
    }
    showToast(linkedToast(selected.length, staffFullName));
    return true;
  }

  return (
    <section className="rounded-2xl border border-line bg-surface px-[18px] py-4">
      <h2 className="m-0 mb-3.5 text-[12.5px] font-extrabold tracking-[0.8px] text-label">
        ADULTOS MAYORES VINCULADOS
      </h2>
      <div className="flex flex-col gap-3.5">
        {linkedElderly.length === 0 && (
          <p className="m-0 text-[14.5px] text-muted-strong">
            Todavía no hay adultos mayores vinculados.
          </p>
        )}
        {linkedElderly.map((elderly) => (
          <LinkedElderlyRow
            key={elderly.linkId}
            elderly={elderly}
            canUnlink={canManageLinks}
            onUnlink={() => setPendingUnlink(elderly)}
          />
        ))}
        {canManageLinks && (
          <LinkElderlyDialog
            staffFullName={staffFullName}
            options={availableElderly}
            onLink={link}
            triggerRef={linkTriggerRef}
          />
        )}
      </div>
      <UnlinkElderlyDialog
        elderly={pendingUnlink}
        staffFullName={staffFullName}
        onConfirm={unlink}
        onUnlinked={() => linkTriggerRef.current?.focus()}
        onClose={() => setPendingUnlink(null)}
      />
      {toast && (
        <Toast
          key={toast.id}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </section>
  );
}
