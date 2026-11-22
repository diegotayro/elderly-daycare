"use client";

import { useId, useState, useTransition, type FormEvent } from "react";
import { avatarTones, type AvatarTone } from "@/elderly/avatar-tones";
import { FieldError } from "@/feed/components/FieldError";
import { Avatar } from "@/shared/components/Avatar";
import { SendIcon } from "@/shared/components/icons/SendIcon";
import { createComment } from "../actions/create-comment";
import { commentMessages } from "../comment-messages";
import type { CommentView, CreateCommentResult } from "../types";
import { COMMENT_MAX_LENGTH, validateCommentBody } from "../validate-comment-body";
import { useCommentInputRef } from "./CommentInputProvider";

type CommentComposerProps = {
  postId: string;
  author: { initial: string; tone: AvatarTone; photoUrl: string | null };
  onCreated: (comment: CommentView) => void;
  onSendError: () => void;
};

// Sin red la Server Action lanza en vez de devolver "error": se trata igual
async function trySendComment(
  postId: string,
  body: string,
): Promise<CreateCommentResult> {
  try {
    return await createComment(postId, body);
  } catch {
    return { status: "error" };
  }
}

export function CommentComposer({
  postId,
  author,
  onCreated,
  onSendError,
}: CommentComposerProps) {
  const inputRef = useCommentInputRef();
  const inputId = useId();
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isPending) return;

    const validation = validateCommentBody(body);
    if (!validation.valid) {
      setError(validation.error);
      return;
    }
    setError(null);

    startTransition(async () => {
      const result = await trySendComment(postId, body);
      if (result.status === "ok") {
        setBody("");
        onCreated(result.comment);
      } else if (result.status === "invalid") {
        setError(result.error);
      } else {
        onSendError();
      }
    });
  }

  return (
    // Con la barra inferior móvil fija (h-16), el campo se ancla encima de ella
    <form
      onSubmit={submit}
      className="sticky bottom-16 z-[5] bg-cream py-2 lg:bottom-0"
    >
      <div className="flex items-center gap-3">
        <Avatar
          initial={author.initial}
          size={38}
          fontSize={15}
          colors={avatarTones[author.tone]}
          photoUrl={author.photoUrl}
        />
        <input
          ref={inputRef}
          id={inputId}
          type="text"
          value={body}
          onChange={(event) => setBody(event.target.value)}
          maxLength={COMMENT_MAX_LENGTH}
          placeholder={commentMessages.placeholder}
          aria-label={commentMessages.placeholder}
          aria-invalid={error !== null}
          aria-describedby={error ? `${inputId}-error` : undefined}
          autoComplete="off"
          className="min-w-0 flex-1 rounded-[14px] border-[1.5px] border-line bg-white px-4 py-[13px] text-[15px] text-ink placeholder:text-placeholder focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral-strong"
        />
        <button
          type="submit"
          disabled={isPending || body.trim() === ""}
          aria-label={commentMessages.sendButtonLabel}
          className="flex size-[46px] flex-none cursor-pointer items-center justify-center rounded-[14px] bg-linear-to-b from-[#F4977E] to-[#EE8164] text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral-strong disabled:cursor-default disabled:opacity-50"
        >
          <SendIcon size={20} />
        </button>
      </div>
      <div className="pl-[50px]">
        <FieldError fieldId={inputId} message={error} />
      </div>
    </form>
  );
}
