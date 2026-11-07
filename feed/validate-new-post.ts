import { postTypeStyles } from "./post-type-styles";
import { MAX_BODY_LENGTH } from "./new-post-limits";
import { newPostMessages as messages } from "./new-post-messages";
import type { AudienceSelection, NewPostErrors, NewPostInput } from "./types";

type ValidationRules = {
  roomIds: string[];
  elderlyIds: string[];
};

function isValidAudience(
  audience: AudienceSelection,
  rules: ValidationRules,
): boolean {
  switch (audience.kind) {
    case "none":
      return false;
    case "elderly":
      return (
        audience.elderlyIds.length > 0 &&
        audience.elderlyIds.every((id) => rules.elderlyIds.includes(id))
      );
    case "room":
      return rules.roomIds.includes(audience.roomId);
    case "daycare":
      return true;
  }
}

function validateBody(body: string): string | undefined {
  if (body.trim() === "") return messages.bodyRequired;
  if (body.length > MAX_BODY_LENGTH) return messages.bodyTooLong;
}

export function validateNewPost(
  input: NewPostInput,
  rules: ValidationRules,
): NewPostErrors {
  const candidates: NewPostErrors = {
    audience: isValidAudience(input.audience, rules)
      ? undefined
      : messages.audienceRequired,
    type: Object.hasOwn(postTypeStyles, input.type)
      ? undefined
      : messages.typeRequired,
    body: validateBody(input.body),
  };

  return Object.fromEntries(
    Object.entries(candidates).filter(([, message]) => message !== undefined),
  );
}
