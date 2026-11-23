import type { PostType } from "@/shared/database/types";

export type SummaryStatus =
  | { kind: "empty" } // sin fila
  | { kind: "draft" }
  | { kind: "sent"; sentAt: string }; // ISO

export type SummaryHighlight = {
  id: string; // post id
  type: PostType; // nap | activity | achievement
  title: string; // "¡Caminó sin su andador!"
  time: string; // "14:20"
  detail: string; // "Un gran paso, estaba feliz de contarlo."
  href: string; // /posts/[id] o /family/posts/[id]
};

export type DailySummaryData = {
  elderlyId: string;
  firstName: string;
  day: string; // "aaaa-mm-dd"
  dateLabel: string; // "martes 17 de junio"
  status: SummaryStatus;
  mealsCount: number;
  sleepMinutes: number | null;
  momentsCount: number; // = highlights.length
  mood: string | null;
  highlights: SummaryHighlight[];
};

export type SummaryDayNav = {
  previousDay: string | null;
  nextDay: string | null;
  maxDay: string; // hoy
};

export type DailySummaryInput = {
  mood: string; // "" = sin dato
  sleepHours: string;
  sleepMinutes: string;
};

export type SaveDailySummaryResult =
  | { status: "success"; message: string }
  | {
      status: "invalid";
      errors: Partial<Record<keyof DailySummaryInput, string>>;
    }
  | { status: "error" };
