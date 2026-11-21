import { commentMessages } from "./comment-messages";

export const COMMENT_MAX_LENGTH = 1000;

export type CommentBodyValidation =
  | { valid: true; body: string }
  | { valid: false; error: string };

// Lo usan el cliente y el servidor; el servidor valida igual que el check de la tabla
export function validateCommentBody(rawBody: string): CommentBodyValidation {
  const body = rawBody.trim();
  if (body.length === 0) return { valid: false, error: commentMessages.emptyError };
  if (body.length > COMMENT_MAX_LENGTH) {
    return { valid: false, error: commentMessages.tooLongError };
  }
  return { valid: true, body };
}
