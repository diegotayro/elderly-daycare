import Link from "next/link";
import type { Notice } from "../types";
import { NoticeBadge } from "./NoticeBadge";
import { NoticeText } from "./NoticeText";

const CARD_CLASS_NAME =
  "flex items-start gap-[13px] rounded-2xl border border-line bg-surface px-[18px] py-4";

const LINK_FOCUS_CLASS_NAME =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral-strong";

type NoticeCardProps = {
  notice: Notice;
};

function NoticeCardContent({ notice }: NoticeCardProps) {
  return (
    <>
      <NoticeBadge notice={notice} />
      <div className="min-w-0 flex-1">
        <div className="text-[14.5px] text-body">
          <NoticeText notice={notice} />
        </div>
        <div className="mt-[3px] text-[12.5px] text-muted">{notice.timeLabel}</div>
      </div>
    </>
  );
}

export function NoticeCard({ notice }: NoticeCardProps) {
  // Los avisos de comentario y reacción llevan al detalle de la publicación
  if (notice.kind === "comment" || notice.kind === "reaction") {
    return (
      <Link
        href={`/posts/${notice.post.postId}`}
        className={`${CARD_CLASS_NAME} ${LINK_FOCUS_CLASS_NAME}`}
      >
        <NoticeCardContent notice={notice} />
      </Link>
    );
  }

  return (
    <div className={CARD_CLASS_NAME}>
      <NoticeCardContent notice={notice} />
    </div>
  );
}
