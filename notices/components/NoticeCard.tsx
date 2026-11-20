import type { Notice } from "../types";
import { NoticeBadge } from "./NoticeBadge";
import { NoticeText } from "./NoticeText";

type NoticeCardProps = {
  notice: Notice;
};

export function NoticeCard({ notice }: NoticeCardProps) {
  return (
    <div className="flex items-start gap-[13px] rounded-2xl border border-line bg-surface px-[18px] py-4">
      <NoticeBadge notice={notice} />
      <div className="min-w-0 flex-1">
        <div className="text-[14.5px] text-body">
          <NoticeText notice={notice} />
        </div>
        <div className="mt-[3px] text-[12.5px] text-muted">{notice.timeLabel}</div>
      </div>
    </div>
  );
}
