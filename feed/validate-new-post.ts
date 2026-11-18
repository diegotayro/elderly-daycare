import { postTypeStyles } from "./post-type-styles";
import { MAX_BODY_LENGTH, MAX_TITLE_LENGTH } from "./new-post-limits";
import { newPostMessages as messages } from "./new-post-messages";
import type {
  AudienceElderlyOption,
  AudienceSelection,
  NewPostErrors,
  NewPostInput,
} from "./types";

type ValidationRules = {
  roomIds: string[];
  elderly: Pick<AudienceElderlyOption, "id" | "firstName" | "photoConsent">[];
  canPostToDaycare: boolean;
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
        audience.elderlyIds.every((id) =>
          rules.elderly.some((elderly) => elderly.id === id),
        )
      );
    case "room":
      return rules.roomIds.includes(audience.roomId);
    case "daycare":
      return rules.canPostToDaycare;
  }
}

function validateTitle(input: NewPostInput): string | undefined {
  const hasTitle =
    input.audience.kind === "room" || input.audience.kind === "daycare";
  if (hasTitle && input.title.trim().length > MAX_TITLE_LENGTH) {
    return messages.titleTooLong;
  }
}

function validateBody(body: string): string | undefined {
  if (body.trim() === "") return messages.bodyRequired;
  if (body.length > MAX_BODY_LENGTH) return messages.bodyTooLong;
}

// Con fotos, un adulto mayor etiquetado sin consentimiento bloquea la publicación
function validatePhotoConsent(
  input: NewPostInput,
  rules: ValidationRules,
): string | undefined {
  if (input.audience.kind !== "elderly" || input.photoCount === 0) return;

  const taggedIds = input.audience.elderlyIds;
  const namesWithoutConsent = rules.elderly
    .filter(
      (elderly) => taggedIds.includes(elderly.id) && !elderly.photoConsent,
    )
    .map((elderly) => elderly.firstName);

  if (namesWithoutConsent.length > 0) {
    return messages.photoConsentMissing(namesWithoutConsent);
  }
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
    title: validateTitle(input),
    body: validateBody(input.body),
    photos: validatePhotoConsent(input, rules),
  };

  return Object.fromEntries(
    Object.entries(candidates).filter(([, message]) => message !== undefined),
  );
}
