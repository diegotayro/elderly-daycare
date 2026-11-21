"use client";

import { useCommentInputRef } from "@/comments/components/CommentInputProvider";
import { CommentIcon } from "@/shared/components/icons/CommentIcon";
import { HeartIcon } from "@/shared/components/icons/HeartIcon";
import { useReactionToggle } from "../use-reaction-toggle";

// Colores fijos del mockup; los círculos son decorativos (la RLS no deja leer quién reaccionó)
const LIKE_CIRCLE_COLORS = ["#F8D2DE", "#F7E7A6", "#CFEBD8"];

const ACTION_BUTTON_CLASS_NAME =
  "flex flex-1 cursor-pointer items-center justify-center gap-[9px] rounded-[14px] border-[1.5px] px-3 py-[13px] text-[15px] leading-[normal] font-extrabold transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral-strong motion-reduce:transition-none";

const NEUTRAL_BUTTON_CLASS_NAME = "border-line bg-surface text-nav";

function buildLikesLabel(count: number): string {
  return count === 1 ? "A 1 persona le gusta" : `A ${count} personas les gusta`;
}

type PostDetailReactionsProps = {
  postId: string;
  initialReacted: boolean;
  initialCount: number;
};

export function PostDetailReactions({
  postId,
  initialReacted,
  initialCount,
}: PostDetailReactionsProps) {
  const { reacted, count, isPending, toggle, toast } = useReactionToggle({
    postId,
    initialReacted,
    initialCount,
  });
  const commentInputRef = useCommentInputRef();
  const circleColors = LIKE_CIRCLE_COLORS.slice(0, Math.min(count, 3));

  return (
    <>
      {count > 0 && (
        <div className="mt-[18px] flex items-center gap-2.5 text-sm text-muted-strong">
          <span aria-hidden="true" className="flex">
            {circleColors.map((color) => (
              <span
                key={color}
                className="-ml-[9px] size-6 rounded-full border-2 border-surface first:ml-0"
                style={{ backgroundColor: color }}
              />
            ))}
          </span>
          {buildLikesLabel(count)}
        </div>
      )}
      <div className="mt-4 flex gap-3">
        <button
          type="button"
          onClick={toggle}
          aria-pressed={reacted}
          aria-disabled={isPending}
          className={`${ACTION_BUTTON_CLASS_NAME} ${
            reacted
              ? "border-field-focus bg-[#FBD8CC] text-coral-strong"
              : NEUTRAL_BUTTON_CLASS_NAME
          }`}
        >
          <HeartIcon size={19} filled={reacted} />
          Me encanta
        </button>
        <button
          type="button"
          onClick={() => commentInputRef.current?.focus()}
          className={`${ACTION_BUTTON_CLASS_NAME} ${NEUTRAL_BUTTON_CLASS_NAME}`}
        >
          <CommentIcon size={18} />
          Comentar
        </button>
      </div>
      {toast}
    </>
  );
}
