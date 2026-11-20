import type { PostAudience } from "@/shared/database/types";

export type NoticeKind = "comment" | "reaction" | "account_activated" | "reminder";

export type NoticePost = {
  audience: PostAudience;
  title: string | null;
  roomName: string | null;
  elderlyNames: string[];
};

type NoticeBase = {
  id: string;
  timeLabel: string; // "Hace 12 min", "Ayer 14:30"
};

export type Notice =
  | (NoticeBase & { kind: "comment"; actorName: string; post: NoticePost })
  | (NoticeBase & {
      kind: "reaction";
      actorName: string | null; // null → "Un familiar"
      othersCount: number;
      post: NoticePost;
    })
  | (NoticeBase & {
      kind: "account_activated";
      actorName: string;
      elderlyFirstName: string;
      isFirstLink: boolean;
    })
  | (NoticeBase & { kind: "reminder" });
