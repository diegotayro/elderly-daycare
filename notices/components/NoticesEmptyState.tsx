import { emptyNoticesMessage } from "../notice-messages";

export function NoticesEmptyState() {
  return (
    <div className="rounded-2xl border border-line bg-surface px-[18px] py-4 text-[14.5px] text-muted-strong">
      {emptyNoticesMessage}
    </div>
  );
}
