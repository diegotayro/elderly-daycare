import { getLimaDay } from "@/shared/date/get-lima-today";
import type { ListNoticesRow } from "@/shared/database/types";
import { formatNoticeTime, REMINDER_TIME_LABEL } from "./format-notice-time";
import { SUMMARY_REMINDER_TIME } from "./notice-limits";
import type { Notice, NoticePost } from "./types";

// Solo se usa si la RLS no deja leer el nombre de quien actuó y el aviso exige uno
const UNKNOWN_ACTOR_NAME = "Alguien";

type DatedNotice = { occurredAt: Date; notice: Notice };

// Lima no tiene horario de verano, el offset es fijo
export function getReminderInstant(now: Date): Date {
  return new Date(`${getLimaDay(now)}T${SUMMARY_REMINDER_TIME}:00-05:00`);
}

function toNoticePost(row: ListNoticesRow): NoticePost | null {
  if (row.post_audience === null) return null;

  return {
    audience: row.post_audience,
    title: row.post_title,
    roomName: row.room_name,
    elderlyNames: row.elderly_names ?? [],
  };
}

function toDatedNotice(row: ListNoticesRow, now: Date): DatedNotice | null {
  const occurredAt = new Date(row.occurred_at);
  const base = { id: row.id, timeLabel: formatNoticeTime(occurredAt, now) };

  if (row.kind === "account_activated") {
    return {
      occurredAt,
      notice: {
        ...base,
        kind: row.kind,
        actorName: row.actor_name ?? UNKNOWN_ACTOR_NAME,
        elderlyFirstName: row.elderly_first_name ?? "",
        isFirstLink: row.is_first_link === true,
      },
    };
  }

  const post = toNoticePost(row);
  if (!post) return null;

  if (row.kind === "comment") {
    return {
      occurredAt,
      notice: { ...base, kind: row.kind, actorName: row.actor_name ?? UNKNOWN_ACTOR_NAME, post },
    };
  }

  return {
    occurredAt,
    notice: { ...base, kind: row.kind, actorName: row.actor_name, othersCount: row.others_count, post },
  };
}

function buildReminder(now: Date): DatedNotice {
  return {
    occurredAt: getReminderInstant(now),
    notice: { id: "reminder:daily-summary", kind: "reminder", timeLabel: REMINDER_TIME_LABEL },
  };
}

// Filas de list_notices (+ recordatorio opcional) → avisos del más nuevo al más viejo
export function buildNotices(
  rows: ListNoticesRow[],
  now: Date,
  includeReminder: boolean,
): Notice[] {
  const dated = rows.flatMap((row) => toDatedNotice(row, now) ?? []);
  if (includeReminder) dated.push(buildReminder(now));

  return dated
    .sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime())
    .map(({ notice }) => notice);
}
