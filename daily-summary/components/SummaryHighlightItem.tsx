import Link from "next/link";
import { postTypeStyles } from "@/feed/post-type-styles";
import type { SummaryHighlight } from "../types";

type SummaryHighlightItemProps = {
  highlight: SummaryHighlight;
};

export function SummaryHighlightItem({ highlight }: SummaryHighlightItemProps) {
  const { bg, fg } = postTypeStyles[highlight.type];

  return (
    <li>
      <Link
        href={highlight.href}
        className="-m-2 flex items-start gap-3.5 rounded-2xl p-2 hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral-strong"
      >
        <div
          className="flex size-[38px] flex-none items-center justify-center rounded-full"
          style={{ backgroundColor: bg }}
        >
          <span
            className="size-3 rounded-full"
            style={{ backgroundColor: fg }}
          />
        </div>
        <div className="min-w-0">
          <div
            className="font-display text-base leading-[normal] font-semibold"
            style={{ color: fg }}
          >
            {highlight.title}
          </div>
          <div className="mt-0.5 line-clamp-2 text-sm leading-[normal] text-muted-strong">
            {highlight.time} · {highlight.detail}
          </div>
        </div>
      </Link>
    </li>
  );
}
