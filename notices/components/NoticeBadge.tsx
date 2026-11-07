import { Avatar } from "@/shared/components/Avatar";
import { BellIcon } from "@/shared/components/icons/BellIcon";
import { CheckIcon } from "@/shared/components/icons/CheckIcon";
import { HeartIcon } from "@/shared/components/icons/HeartIcon";
import { noticeKindStyles } from "../notice-kind-styles";
import type { Notice } from "../types";

type NoticeBadgeProps = {
  notice: Notice;
};

function NoticeBadgeContent({ notice }: NoticeBadgeProps) {
  switch (notice.kind) {
    case "account_activated":
      return <CheckIcon strokeWidth={2} />;
    case "reaction":
      return <HeartIcon />;
    case "reminder":
      return <BellIcon />;
    case "comment":
      return null;
  }
}

export function NoticeBadge({ notice }: NoticeBadgeProps) {
  const colors = noticeKindStyles[notice.kind];

  if (notice.kind === "comment") {
    return (
      <Avatar initial={notice.actorName[0]} size={40} fontSize={16} colors={colors} />
    );
  }

  return (
    <div
      className="flex size-10 flex-none items-center justify-center rounded-full"
      style={{ backgroundColor: colors.bg, color: colors.fg }}
    >
      <NoticeBadgeContent notice={notice} />
    </div>
  );
}
