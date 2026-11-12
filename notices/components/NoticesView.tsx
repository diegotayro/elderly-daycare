import type { Notice } from "../types";
import { NoticeCard } from "./NoticeCard";
import { NoticesEmptyState } from "./NoticesEmptyState";
import { NoticesTitle } from "./NoticesTitle";

type NoticesViewProps = {
  notices: Notice[];
};

export function NoticesView({ notices }: NoticesViewProps) {
  return (
    <div className="mx-auto w-full max-w-[680px] px-4 pt-5 pb-8 lg:px-10 lg:pt-[34px] lg:pb-20">
      <header className="mb-[22px]">
        <NoticesTitle />
      </header>
      {notices.length === 0 ? (
        <NoticesEmptyState />
      ) : (
        <div className="flex flex-col gap-3">
          {notices.map((notice) => (
            <NoticeCard key={notice.id} notice={notice} />
          ))}
        </div>
      )}
    </div>
  );
}
