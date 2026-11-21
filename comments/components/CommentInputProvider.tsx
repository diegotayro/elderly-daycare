"use client";

import { createContext, useContext, useRef, type ReactNode, type RefObject } from "react";

type CommentInputRef = RefObject<HTMLInputElement | null>;

const CommentInputContext = createContext<CommentInputRef | null>(null);

// Comparte el input de comentario entre el botón "Comentar" y el campo de abajo
export function CommentInputProvider({ children }: { children: ReactNode }) {
  const inputRef = useRef<HTMLInputElement>(null);

  return <CommentInputContext value={inputRef}>{children}</CommentInputContext>;
}

export function useCommentInputRef(): CommentInputRef {
  const inputRef = useContext(CommentInputContext);
  if (!inputRef) {
    throw new Error("useCommentInputRef debe usarse dentro de CommentInputProvider");
  }
  return inputRef;
}
