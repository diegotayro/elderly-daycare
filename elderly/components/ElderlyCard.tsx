import Link from "next/link";
import { Avatar } from "@/shared/components/Avatar";
import { avatarTones } from "../avatar-tones";
import type { ElderlyListItem } from "../types";
import { ElderlyCardIndicator } from "./ElderlyCardIndicator";

type ElderlyCardProps = {
  item: ElderlyListItem;
};

export function ElderlyCard({ item }: ElderlyCardProps) {
  const isArchived = item.indicator.kind === "archived";

  return (
    <Link
      href={`/elderly/${item.id}`}
      className={`flex min-w-0 items-center gap-3.5 rounded-[18px] border border-line bg-surface p-4 shadow-[0_4px_14px_-12px_rgba(120,90,60,0.5)] transition hover:-translate-y-0.5 hover:border-[#F2A78E] ${isArchived ? "opacity-60" : ""}`}
    >
      <Avatar
        initial={item.initial}
        size={48}
        fontSize={19}
        colors={avatarTones[item.tone]}
      />
      <div className="min-w-0 flex-1">
        <div className="font-display text-base leading-[normal] font-semibold text-ink">
          {item.fullName}
        </div>
        <div className="text-[13px] text-muted">{item.summary}</div>
      </div>
      <ElderlyCardIndicator indicator={item.indicator} />
    </Link>
  );
}
