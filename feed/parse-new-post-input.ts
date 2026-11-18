import { MAX_PHOTOS } from "./new-post-limits";
import type { AudienceSelection, NewPostInput } from "./types";

function isStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) && value.every((item) => typeof item === "string")
  );
}

function parseAudience(value: unknown): AudienceSelection | null {
  if (typeof value !== "object" || value === null) return null;
  const audience = value as Record<string, unknown>;

  switch (audience.kind) {
    case "elderly":
      return isStringArray(audience.elderlyIds)
        ? { kind: "elderly", elderlyIds: audience.elderlyIds }
        : null;
    case "room":
      return typeof audience.roomId === "string"
        ? { kind: "room", roomId: audience.roomId }
        : null;
    case "daycare":
      return { kind: "daycare" };
    default:
      return null;
  }
}

// Las Server Actions reciben datos sin tipar del cliente: se comprueba la forma antes de validar
export function parseNewPostInput(raw: unknown): NewPostInput | null {
  if (typeof raw !== "object" || raw === null) return null;
  const input = raw as Record<string, unknown>;
  const audience = parseAudience(input.audience);

  const hasValidShape =
    audience !== null &&
    typeof input.type === "string" &&
    typeof input.title === "string" &&
    typeof input.body === "string" &&
    Number.isInteger(input.photoCount) &&
    (input.photoCount as number) >= 0 &&
    (input.photoCount as number) <= MAX_PHOTOS;
  if (!hasValidShape) return null;

  return {
    audience,
    type: input.type as string,
    title: input.title as string,
    body: input.body as string,
    photoCount: input.photoCount as number,
  };
}
