import { postTypeStyles } from "@/feed/post-type-styles";
import type { SummaryHighlight } from "../types";

type SummaryHighlightItemProps = {
  highlight: SummaryHighlight;
};

export function SummaryHighlightItem({ highlight }: SummaryHighlightItemProps) {
  const { bg, fg } = postTypeStyles[highlight.type];

  return (
    <li className="flex items-start gap-3.5">
      <div
        className="flex size-[38px] flex-none items-center justify-center rounded-full"
        style={{ backgroundColor: bg }}
      >
        <span className="size-3 rounded-full" style={{ backgroundColor: fg }} />
      </div>
      <div>
        <div
          className="font-display text-base font-semibold"
          style={{ color: fg }}
        >
          {highlight.title}
        </div>
        <div className="mt-0.5 text-sm text-muted-strong">
          {highlight.time} · {highlight.detail}
        </div>
      </div>
    </li>
  );
}
