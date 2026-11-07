import { avatarTones } from "@/elderly/avatar-tones";
import type { NoticeKind } from "./types";

type NoticeKindStyle = { bg: string; fg: string };

export const noticeKindStyles: Record<NoticeKind, NoticeKindStyle> = {
  comment: avatarTones.lilac,
  account_activated: { bg: "#CFEBD8", fg: "#3E9B6C" },
  reaction: { bg: "#FBD8CC", fg: "#D9684A" },
  reminder: { bg: "#F4DC8E", fg: "#9A7B1E" },
};
