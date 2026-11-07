import Link from "next/link";
import type { Notice } from "../types";
import { NoticeBadge } from "./NoticeBadge";
import { NoticeText } from "./NoticeText";

type NoticeCardProps = {
  notice: Notice;
};

const cardClassName =
  "flex items-start gap-[13px] rounded-2xl border border-line bg-surface px-[18px] py-4";
const linkClassName =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral-strong";

export function NoticeCard({ notice }: NoticeCardProps) {
  const content = (
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

  if ("href" in notice) {
    return (
      <Link href={notice.href} className={`${cardClassName} ${linkClassName}`}>
        {content}
      </Link>
    );
  }

  return <div className={cardClassName}>{content}</div>;
}
