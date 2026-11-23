import { MAX_MOOD_LENGTH, MAX_SLEEP_MINUTES } from "./daily-summary-limits";
import { dailySummaryMessages as messages } from "./daily-summary-messages";
import type { DailySummaryInput } from "./types";

export type SummaryIntent = "draft" | "send";
export type DailySummaryErrors = Partial<
  Record<keyof DailySummaryInput, string>
>;

const MAX_SLEEP_HOURS = 5;
const MAX_MINUTES_PART = 59;
const MINUTES_PER_HOUR = 60;

function parseWholeNumber(value: string): number | null {
  const trimmed = value.trim();
  return /^\d+$/.test(trimmed) ? Number(trimmed) : null;
}

// Un campo vacío cuenta como 0 si el otro tiene valor
function toPart(value: string): number | null {
  return value.trim() === "" ? 0 : parseWholeNumber(value);
}

export function hasSleepValue(input: DailySummaryInput): boolean {
  return input.sleepHours.trim() !== "" || input.sleepMinutes.trim() !== "";
}

// Solo se llama con una siesta ya validada; null = sin dato
export function toSleepMinutes(input: DailySummaryInput): number | null {
  if (!hasSleepValue(input)) return null;
  return (
    (toPart(input.sleepHours) ?? 0) * MINUTES_PER_HOUR +
    (toPart(input.sleepMinutes) ?? 0)
  );
}

function validateMood(mood: string, intent: SummaryIntent): string | undefined {
  const trimmed = mood.trim();
  if (trimmed.length > MAX_MOOD_LENGTH) return messages.moodTooLong;
  if (trimmed === "" && intent === "send") return messages.moodRequired;
}

function validateSleep(
  input: DailySummaryInput,
  intent: SummaryIntent,
): DailySummaryErrors {
  if (!hasSleepValue(input)) {
    return intent === "send" ? { sleepHours: messages.sleepRequired } : {};
  }

  const hours = toPart(input.sleepHours);
  const minutes = toPart(input.sleepMinutes);
  if (hours === null || hours > MAX_SLEEP_HOURS) {
    return { sleepHours: messages.sleepOutOfRange };
  }
  if (minutes === null || minutes > MAX_MINUTES_PART) {
    return { sleepMinutes: messages.sleepOutOfRange };
  }
  if (hours * MINUTES_PER_HOUR + minutes > MAX_SLEEP_MINUTES) {
    return { sleepHours: messages.sleepOutOfRange };
  }
  return {};
}

// Con "send" (también al guardar un resumen ya enviado) ánimo y siesta son obligatorios
export function validateDailySummary(
  input: DailySummaryInput,
  intent: SummaryIntent,
): DailySummaryErrors {
  const errors: DailySummaryErrors = {
    mood: validateMood(input.mood, intent),
    ...validateSleep(input, intent),
  };
  return Object.fromEntries(
    Object.entries(errors).filter(([, message]) => message !== undefined),
  );
}
