"use client";

import { useRef, useState } from "react";
import { Toast } from "@/shared/components/toast/Toast";
import type { ToastMessage } from "@/shared/components/toast/types";
import {
  addLinks,
  sortOptionsByName,
  toElderlyOption,
} from "../linked-elderly-changes";
import type { ElderlyOption, LinkedElderly } from "../types";
import { LinkElderlyDialog } from "./LinkElderlyDialog";
import { LinkedElderlyRow } from "./LinkedElderlyRow";
import { UnlinkElderlyDialog } from "./UnlinkElderlyDialog";

type LinkedElderlyCardProps = {
  staffFullName: string;
  linkedElderly: LinkedElderly[];
  availableElderly: ElderlyOption[];
  canManageLinks: boolean;
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
  staffFullName,
  linkedElderly,
  availableElderly,
  canManageLinks,
}: LinkedElderlyCardProps) {
  // Estado local: no se refleja en /staff ni sobrevive a la navegación
  const [linked, setLinked] = useState(linkedElderly);
  const [available, setAvailable] = useState(availableElderly);
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

  function unlink(elderly: LinkedElderly) {
    setLinked((current) =>
      current.filter((item) => item.linkId !== elderly.linkId),
    );
    // Solo los activos se pueden volver a vincular
    if (elderly.status === "active") {
      setAvailable((current) =>
        sortOptionsByName([...current, toElderlyOption(elderly)]),
      );
    }
    setPendingUnlink(null);
    showToast(unlinkedToast(elderly.fullName, staffFullName));
    linkTriggerRef.current?.focus();
  }

  function link(selected: ElderlyOption[]) {
    const selectedIds = new Set(selected.map((option) => option.id));
    setLinked((current) => addLinks(current, selected));
    setAvailable((current) =>
      current.filter((option) => !selectedIds.has(option.id)),
    );
    showToast(linkedToast(selected.length, staffFullName));
  }

  return (
    <section className="rounded-2xl border border-line bg-surface px-[18px] py-4">
      <h2 className="m-0 mb-3.5 text-[12.5px] font-extrabold tracking-[0.8px] text-label">
        ADULTOS MAYORES VINCULADOS
      </h2>
      <div className="flex flex-col gap-3.5">
        {linked.length === 0 && (
          <p className="m-0 text-[14.5px] text-muted-strong">
            Todavía no hay adultos mayores vinculados.
          </p>
        )}
        {linked.map((elderly) => (
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
            options={available}
            onLink={link}
            triggerRef={linkTriggerRef}
          />
        )}
      </div>
      <UnlinkElderlyDialog
        elderly={pendingUnlink}
        staffFullName={staffFullName}
        onConfirm={unlink}
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
