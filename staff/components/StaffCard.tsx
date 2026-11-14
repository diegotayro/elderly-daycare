import Link from "next/link";
import { avatarTones } from "@/elderly/avatar-tones";
import { ElderlyCardIndicator } from "@/elderly/components/ElderlyCardIndicator";
import { Avatar } from "@/shared/components/Avatar";
import type { StaffListItem } from "../types";

type StaffCardProps = {
  item: StaffListItem;
};

const cardClassName =
  "flex min-w-0 items-center gap-3.5 rounded-[18px] border border-line bg-surface p-4 shadow-[0_4px_14px_-12px_rgba(120,90,60,0.5)]";
const linkClassName =
  "transition hover:-translate-y-0.5 hover:border-[#F2A78E] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral";

export function StaffCard({ item }: StaffCardProps) {
  const isArchived = item.indicator.kind === "archived";
  const className = `${cardClassName} ${isArchived ? "opacity-60" : ""}`;
  const content = (
    <>
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
    </>
  );

  if (!item.isLink) return <div className={className}>{content}</div>;

  return (
    <Link
      href={`/staff/${item.id}`}
      className={`${className} ${linkClassName}`}
    >
      {content}
    </Link>
  );
}
