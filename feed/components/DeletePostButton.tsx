"use client";

import { unstable_rethrow, useRouter } from "next/navigation";
import { useState } from "react";
import { ConfirmDialog } from "@/shared/components/ConfirmDialog";
import { Toast } from "@/shared/components/toast/Toast";
import type { ToastMessage } from "@/shared/components/toast/types";
import { deletePost } from "../actions/delete-post";
import {
  DELETE_POST_LABEL,
  deletePostConfirmContent,
  deletePostErrorToast,
  postHasHistoryToast,
} from "../delete-post-messages";
import type { DeletePostResult } from "../types";

type DeletePostButtonProps = {
  postId: string;
  // Se monta igual sin permiso: así el toast sobrevive al refresh que oculta el botón
  canDelete: boolean;
};

export function DeletePostButton({ postId, canDelete }: DeletePostButtonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  // La key reinicia el temporizador cuando un toast reemplaza a otro
  const [toast, setToast] = useState<{
    id: number;
    message: ToastMessage;
  } | null>(null);

  function showToast(message: ToastMessage) {
    setToast((current) => ({ id: (current?.id ?? 0) + 1, message }));
  }

  async function confirm(): Promise<boolean> {
    const result = await deletePost(postId).catch(
      (error: unknown): DeletePostResult => {
        // En éxito la acción redirige y Next rechaza la promesa: no es un fallo
        unstable_rethrow(error);
        return { status: "error" }; // fallo de red
      },
    );

    if (result.status === "has-history") {
      showToast(postHasHistoryToast);
      router.refresh();
      return true;
    }
    showToast(deletePostErrorToast);
    return false;
  }

  return (
    <>
      {canDelete && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="flex min-h-11 shrink-0 cursor-pointer items-center px-1 text-sm font-extrabold text-coral-link focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral-strong"
        >
          {DELETE_POST_LABEL}
        </button>
      )}
      <ConfirmDialog
        content={isOpen ? deletePostConfirmContent : null}
        onConfirm={confirm}
        onClose={() => setIsOpen(false)}
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
