"use client";

import { useRef, useState, useTransition, type ChangeEvent } from "react";
import { Toast } from "@/shared/components/toast/Toast";
import type { ToastMessage } from "@/shared/components/toast/types";
import { avatarMessages } from "../avatar-messages";
import type { AvatarUploadResult } from "../types";
import { uploadAvatar } from "../upload-avatar";

type ChangeAvatarButtonProps = {
  userId: string;
};

const failureToasts: Record<
  Exclude<AvatarUploadResult["status"], "ok">,
  ToastMessage
> = {
  unprocessable: avatarMessages.unprocessableToast,
  error: avatarMessages.uploadErrorToast,
};

// Sin red la Server Action lanza en vez de devolver "error": se trata igual
async function tryUploadAvatar(
  userId: string,
  file: File,
): Promise<AvatarUploadResult> {
  try {
    return await uploadAvatar(userId, file);
  } catch {
    return { status: "error" };
  }
}

export function ChangeAvatarButton({ userId }: ChangeAvatarButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  // La key reinicia el temporizador cuando un toast reemplaza a otro
  const [toast, setToast] = useState<{
    key: number;
    message: ToastMessage;
  } | null>(null);

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    // Se limpia para poder elegir de nuevo el mismo archivo
    event.target.value = "";
    if (!file) return;

    startTransition(async () => {
      const result = await tryUploadAvatar(userId, file);
      if (result.status === "ok") return;
      setToast((current) => ({
        key: (current?.key ?? 0) + 1,
        message: failureToasts[result.status],
      }));
    });
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        tabIndex={-1}
        onChange={handleChange}
      />
      <button
        type="button"
        disabled={isPending}
        onClick={() => inputRef.current?.click()}
        className="cursor-pointer rounded-xl border-[1.5px] border-line bg-white px-4 py-[9px] text-sm font-bold text-nav focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral-strong disabled:cursor-default disabled:opacity-50"
      >
        {avatarMessages.changeButton}
      </button>
      {toast && (
        <Toast
          key={toast.key}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
}
