"use client";

import { useOptimistic, useState, useTransition } from "react";
import { HeartIcon } from "@/shared/components/icons/HeartIcon";
import { Toast } from "@/shared/components/toast/Toast";
import type { ToastMessage } from "@/shared/components/toast/types";
import { setReaction } from "../actions/set-reaction";
import { reactionMessages } from "../reaction-messages";

const errorToast: ToastMessage = {
  tone: "error",
  title: reactionMessages.saveErrorTitle,
  description: reactionMessages.saveErrorDescription,
};

type ReactionState = { reacted: boolean; count: number };

type ReactionButtonProps = {
  postId: string;
  initialReacted: boolean;
  initialCount: number;
};

// Sin red la Server Action lanza en vez de devolver "error": se trata igual
async function trySetReaction(
  postId: string,
  reacted: boolean,
): Promise<boolean> {
  try {
    const result = await setReaction(postId, reacted);
    return result.status === "ok";
  } catch {
    return false;
  }
}

function toggled({ reacted, count }: ReactionState): ReactionState {
  return { reacted: !reacted, count: count + (reacted ? -1 : 1) };
}

export function ReactionButton({
  postId,
  initialReacted,
  initialCount,
}: ReactionButtonProps) {
  const [confirmed, setConfirmed] = useState<ReactionState>({
    reacted: initialReacted,
    count: initialCount,
  });
  const [shown, showOptimistic] = useOptimistic(confirmed);
  const [isPending, startTransition] = useTransition();
  // La key reinicia el temporizador cuando un toast reemplaza a otro
  const [toast, setToast] = useState<{ id: number } | null>(null);

  function toggle() {
    if (isPending) return;
    const next = toggled(shown);

    startTransition(async () => {
      showOptimistic(next);
      const saved = await trySetReaction(postId, next.reacted);

      if (saved) {
        setConfirmed(next);
      } else {
        setToast((current) => ({ id: (current?.id ?? 0) + 1 }));
      }
    });
  }

  return (
    <>
      {/* El padding con margen negativo amplía el área táctil a 44×44 sin mover el layout */}
      <button
        type="button"
        onClick={toggle}
        aria-pressed={shown.reacted}
        aria-disabled={isPending}
        aria-label={`Me encanta, ${shown.count}`}
        className={`-mx-3 -my-3.5 flex cursor-pointer items-center gap-[7px] rounded-xl px-3 py-3.5 text-sm leading-[normal] font-bold transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral-strong motion-reduce:transition-none ${
          shown.reacted ? "text-coral-icon" : "text-muted-strong"
        }`}
      >
        <HeartIcon size={19} filled={shown.reacted} />
        {shown.count}
      </button>
      {toast && (
        <Toast
          key={toast.id}
          message={errorToast}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
}
