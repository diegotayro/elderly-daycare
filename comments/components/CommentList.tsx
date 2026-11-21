"use client";

import { useState } from "react";
import type { AvatarTone } from "@/elderly/avatar-tones";
import { Toast } from "@/shared/components/toast/Toast";
import type { ToastMessage } from "@/shared/components/toast/types";
import { deleteComment } from "../actions/delete-comment";
import { commentMessages } from "../comment-messages";
import type { CommentView } from "../types";
import { CommentComposer } from "./CommentComposer";
import { CommentItem } from "./CommentItem";
import { ConfirmDeleteCommentDialog } from "./ConfirmDeleteCommentDialog";

const sendErrorToast: ToastMessage = {
  tone: "error",
  title: commentMessages.sendErrorTitle,
  description: commentMessages.sendErrorDescription,
};

const deleteErrorToast: ToastMessage = {
  tone: "error",
  title: commentMessages.deleteErrorTitle,
  description: commentMessages.deleteErrorDescription,
};

type CommentListProps = {
  postId: string;
  initialComments: CommentView[];
  author: { initial: string; tone: AvatarTone };
};

// Sin red la Server Action lanza en vez de devolver "error": se trata igual
async function tryDeleteComment(commentId: string): Promise<boolean> {
  try {
    const result = await deleteComment(commentId);
    return result.status === "ok";
  } catch {
    return false;
  }
}

export function CommentList({
  postId,
  initialComments,
  author,
}: CommentListProps) {
  const [comments, setComments] = useState(initialComments);
  const [commentIdToDelete, setCommentIdToDelete] = useState<string | null>(
    null,
  );
  // La key reinicia el temporizador cuando un toast reemplaza a otro
  const [toast, setToast] = useState<{
    key: number;
    message: ToastMessage;
  } | null>(null);

  function showToast(message: ToastMessage) {
    setToast((current) => ({ key: (current?.key ?? 0) + 1, message }));
  }

  async function confirmDelete() {
    if (commentIdToDelete === null) return;

    const wasDeleted = await tryDeleteComment(commentIdToDelete);
    if (wasDeleted) {
      setComments((current) =>
        current.filter((comment) => comment.id !== commentIdToDelete),
      );
    } else {
      showToast(deleteErrorToast);
    }
  }

  return (
    <section>
      <h2
        aria-live="polite"
        className="m-0 mt-6 mb-3.5 text-[12.5px] font-extrabold tracking-[0.8px] text-label"
      >
        COMENTARIOS · {comments.length}
      </h2>
      {comments.length === 0 ? (
        <p className="m-0 mb-[18px] text-[14.5px] text-muted">
          {commentMessages.emptyList}
        </p>
      ) : (
        <ul className="m-0 mb-[18px] flex list-none flex-col gap-3.5 p-0">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              onDelete={setCommentIdToDelete}
            />
          ))}
        </ul>
      )}
      <CommentComposer
        postId={postId}
        author={author}
        onCreated={(comment) => setComments((current) => [...current, comment])}
        onSendError={() => showToast(sendErrorToast)}
      />
      <ConfirmDeleteCommentDialog
        isOpen={commentIdToDelete !== null}
        onConfirm={confirmDelete}
        onClose={() => setCommentIdToDelete(null)}
      />
      {toast && (
        <Toast
          key={toast.key}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </section>
  );
}
