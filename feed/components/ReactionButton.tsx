"use client";

import { HeartIcon } from "@/shared/components/icons/HeartIcon";
import { useReactionToggle } from "../use-reaction-toggle";

type ReactionButtonProps = {
  postId: string;
  initialReacted: boolean;
  initialCount: number;
};

export function ReactionButton({
  postId,
  initialReacted,
  initialCount,
}: ReactionButtonProps) {
  const { reacted, count, isPending, toggle, toast } = useReactionToggle({
    postId,
    initialReacted,
    initialCount,
  });

  return (
    <>
      {/* El padding con margen negativo amplía el área táctil a 44×44 sin mover el layout */}
      <button
        type="button"
        onClick={toggle}
        aria-pressed={reacted}
        aria-disabled={isPending}
        aria-label={`Me encanta, ${count}`}
        className={`-mx-3 -my-3.5 flex cursor-pointer items-center gap-[7px] rounded-xl px-3 py-3.5 text-sm leading-[normal] font-bold transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral-strong motion-reduce:transition-none ${
          reacted ? "text-coral-icon" : "text-muted-strong"
        }`}
      >
        <HeartIcon size={19} filled={reacted} />
        {count}
      </button>
      {toast}
    </>
  );
}
