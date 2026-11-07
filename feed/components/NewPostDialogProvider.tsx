"use client";

import {
  createContext,
  useContext,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { NewPostOptions } from "../types";
import { NewPostForm } from "./NewPostForm";

type NewPostDialogContextValue = { open: () => void };

const NewPostDialogContext = createContext<NewPostDialogContextValue | null>(
  null,
);

export function useNewPostDialog(): NewPostDialogContextValue {
  const context = useContext(NewPostDialogContext);
  if (!context) {
    throw new Error(
      "useNewPostDialog must be used inside NewPostDialogProvider",
    );
  }
  return context;
}

type NewPostDialogProviderProps = {
  options: NewPostOptions;
  children: ReactNode;
};

export function NewPostDialogProvider({
  options,
  children,
}: NewPostDialogProviderProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  // Cambiar la key remonta el formulario: queda vacío y sin errores
  const [formKey, setFormKey] = useState(0);

  function open() {
    const dialog = dialogRef.current;
    dialog?.showModal();
    dialog?.querySelector<HTMLElement>("[data-audience-chip]")?.focus();
  }

  return (
    <NewPostDialogContext value={{ open }}>
      {children}
      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        onClose={() => setFormKey((key) => key + 1)}
        className="m-0 h-dvh max-h-none w-full max-w-none overflow-hidden border-0 border-line bg-auth-bg p-0 text-ink backdrop:bg-ink/40 open:flex open:flex-col sm:mx-auto sm:mt-10 sm:mb-auto sm:h-fit sm:max-h-[calc(100dvh-80px)] sm:max-w-[580px] sm:rounded-3xl sm:border sm:shadow-[0_20px_50px_-24px_rgba(63,54,46,0.35)]"
      >
        <NewPostForm
          key={formKey}
          options={options}
          titleId={titleId}
          onCancel={() => dialogRef.current?.close()}
        />
      </dialog>
    </NewPostDialogContext>
  );
}
