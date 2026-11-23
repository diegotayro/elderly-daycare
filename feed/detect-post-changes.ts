import type { AudienceSelection, NewPostInput } from "./types";

export type PostFormFields = Pick<NewPostInput, "type" | "title" | "body">;

type PostEditState = {
  audience: AudienceSelection;
  fields: PostFormFields;
  removedPhotoCount: number;
  newPhotoCount: number;
};

function isSameAudience(a: AudienceSelection, b: AudienceSelection): boolean {
  if (a.kind !== b.kind) return false;
  if (a.kind === "room" && b.kind === "room") return a.roomId === b.roomId;
  if (a.kind === "elderly" && b.kind === "elderly") {
    return (
      a.elderlyIds.length === b.elderlyIds.length &&
      a.elderlyIds.every((id) => b.elderlyIds.includes(id))
    );
  }
  return true;
}

// true si el formulario difiere de la publicación original (habilita "Guardar")
export function detectPostChanges(
  initial: NewPostInput,
  current: PostEditState,
): boolean {
  return (
    current.removedPhotoCount > 0 ||
    current.newPhotoCount > 0 ||
    !isSameAudience(initial.audience, current.audience) ||
    initial.type !== current.fields.type ||
    initial.body.trim() !== current.fields.body.trim() ||
    initial.title.trim() !== current.fields.title.trim()
  );
}
