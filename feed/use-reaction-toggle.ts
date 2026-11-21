"use client";

import {
  createElement,
  useOptimistic,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { Toast } from "@/shared/components/toast/Toast";
import type { ToastMessage } from "@/shared/components/toast/types";
import { setReaction } from "./actions/set-reaction";
import { reactionMessages } from "./reaction-messages";

const errorToast: ToastMessage = {
  tone: "error",
  title: reactionMessages.saveErrorTitle,
  description: reactionMessages.saveErrorDescription,
};

type ReactionState = { reacted: boolean; count: number };

type UseReactionToggleInput = {
  postId: string;
  initialReacted: boolean;
  initialCount: number;
};

type UseReactionToggleResult = {
  reacted: boolean;
  count: number;
  isPending: boolean;
  toggle: () => void;
  toast: ReactNode; // toast de error; null si no hay
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

export function useReactionToggle({
  postId,
  initialReacted,
  initialCount,
}: UseReactionToggleInput): UseReactionToggleResult {
  const [confirmed, setConfirmed] = useState<ReactionState>({
    reacted: initialReacted,
    count: initialCount,
  });
  const [shown, showOptimistic] = useOptimistic(confirmed);
  const [isPending, startTransition] = useTransition();
  // La key reinicia el temporizador cuando un toast reemplaza a otro
  const [toastKey, setToastKey] = useState<number | null>(null);

  function toggle() {
    if (isPending) return;
    const next = toggled(shown);

    startTransition(async () => {
      showOptimistic(next);
      const saved = await trySetReaction(postId, next.reacted);

      if (saved) {
        setConfirmed(next);
      } else {
        setToastKey((current) => (current ?? 0) + 1);
      }
    });
  }

  const toast =
    toastKey === null
      ? null
      : createElement(Toast, {
          key: toastKey,
          message: errorToast,
          onClose: () => setToastKey(null),
        });

  return { ...shown, isPending, toggle, toast };
}
