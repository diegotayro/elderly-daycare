import { avatarTones } from "@/elderly/avatar-tones";
import { Avatar } from "@/shared/components/Avatar";
import { commentMessages } from "../comment-messages";
import type { CommentView } from "../types";

type CommentItemProps = {
  comment: CommentView;
  onDelete: (commentId: string) => void;
};

export function CommentItem({ comment, onDelete }: CommentItemProps) {
  return (
    <li className="flex items-start gap-3">
      <Avatar
        initial={comment.authorInitial}
        size={38}
        fontSize={15}
        colors={avatarTones[comment.authorTone]}
      />
      <div className="min-w-0 flex-1 rounded-[14px] border border-line bg-surface px-[15px] py-3">
        <div className="mb-[3px] flex items-baseline gap-2">
          <span className="truncate text-sm font-extrabold text-ink">
            {comment.authorName}
          </span>
          {comment.roleLabel && (
            <span className="flex-none text-xs text-muted">
              · {comment.roleLabel}
            </span>
          )}
          <span className="flex-1" />
          <span className="flex-none text-xs text-muted">
            {comment.timeLabel}
          </span>
        </div>
        <p className="m-0 text-[14.5px] leading-[1.45] break-words text-body">
          {comment.body}
        </p>
        {comment.canDelete && (
          // El alto de 44 px se compensa con margen negativo para no agrandar la burbuja
          <div className="-mb-3 flex justify-end">
            <button
              type="button"
              onClick={() => onDelete(comment.id)}
              aria-label={`${commentMessages.deleteLink} comentario de ${comment.authorName}`}
              className="flex h-11 min-w-11 cursor-pointer items-center justify-center rounded-lg px-2 text-[12.5px] font-extrabold text-coral-link focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral-strong"
            >
              {commentMessages.deleteLink}
            </button>
          </div>
        )}
      </div>
    </li>
  );
}
