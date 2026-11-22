import type { AvatarTone } from "@/elderly/avatar-tones";

export type CommentView = {
  id: string;
  authorInitial: string; // "L"; "?" si la RLS no deja leer al autor
  authorTone: AvatarTone;
  authorPhotoUrl: string | null; // url firmada del avatar; null si no tiene o no se pudo firmar
  authorName: string; // full_name; "Usuario" si no se puede leer
  roleLabel: string | null; // null si no se puede leer al autor
  timeLabel: string; // "10:02" | "Ayer 10:02" | "17 nov 10:02"
  body: string;
  canDelete: boolean; // autor = yo, o yo soy admin
};

export type CreateCommentResult =
  | { status: "ok"; comment: CommentView }
  | { status: "invalid"; error: string }
  | { status: "error" };

export type DeleteCommentResult = { status: "ok" } | { status: "error" };
