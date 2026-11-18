"use client";

import {
  createContext,
  Suspense,
  use,
  useContext,
  useId,
  useRef,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { SkeletonBlock } from "@/shared/components/SkeletonBlock";
import { Toast } from "@/shared/components/toast/Toast";
import type { ToastMessage } from "@/shared/components/toast/types";
import { newPostMessages as messages } from "../new-post-messages";
import { publishPost } from "../publish-post";
import type {
  CreatePostResult,
  NewPostErrors,
  NewPostInput,
  NewPostOptions,
} from "../types";
import { NewPostForm } from "./NewPostForm";

const successToast: ToastMessage = {
  tone: "success",
  title: messages.publishSuccessTitle,
  description: messages.publishSuccessDescription,
};

const errorToast: ToastMessage = {
  tone: "error",
  title: messages.publishErrorTitle,
  description: messages.publishErrorDescription,
};

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

function NewPostFormSkeleton() {
  return (
    <div aria-busy="true" className="flex flex-col gap-6 px-[26px] py-6">
      <SkeletonBlock className="h-6 w-1/2 rounded-full" />
      <SkeletonBlock className="h-24 rounded-2xl" />
      <SkeletonBlock className="h-12 rounded-2xl" />
      <SkeletonBlock className="h-32 rounded-2xl" />
    </div>
  );
}

type NewPostFormLoaderProps = {
  optionsPromise: Promise<NewPostOptions>;
  titleId: string;
  isPending: boolean;
  onCancel: () => void;
  onPublish: (
    input: NewPostInput,
    photos: File[],
    showFieldErrors: (errors: NewPostErrors) => void,
  ) => void;
};

function NewPostFormLoader({
  optionsPromise,
  ...formProps
}: NewPostFormLoaderProps) {
  const options = use(optionsPromise);
  return <NewPostForm options={options} {...formProps} />;
}

type NewPostDialogProviderProps = {
  optionsPromise: Promise<NewPostOptions>;
  children: ReactNode;
};

export function NewPostDialogProvider({
  optionsPromise,
  children,
}: NewPostDialogProviderProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  // Cambiar la key remonta el formulario: queda vacío y sin errores
  const [formKey, setFormKey] = useState(0);
  const [isPending, startTransition] = useTransition();
  // El evento close llega después de close(): necesita saber si la publicación ya terminó
  const isPublishingRef = useRef(false);
  // La key reinicia el temporizador cuando un toast reemplaza a otro
  const [toast, setToast] = useState<{
    id: number;
    message: ToastMessage;
  } | null>(null);

  function showToast(message: ToastMessage) {
    setToast((current) => ({ id: (current?.id ?? 0) + 1, message }));
  }

  function closeToast() {
    setToast(null);
  }

  function publish(
    input: NewPostInput,
    photos: File[],
    showFieldErrors: (errors: NewPostErrors) => void,
  ) {
    isPublishingRef.current = true;
    startTransition(async () => {
      const result = await publishPost(input, photos).catch(
        (): CreatePostResult => ({ status: "error" }), // fallo de red
      );
      isPublishingRef.current = false;
      if (result.status === "invalid") {
        showFieldErrors(result.errors);
      } else if (result.status === "error") {
        showToast(errorToast);
      } else {
        dialogRef.current?.close();
        showToast(successToast);
      }
    });
  }

  function handleDialogClose() {
    // Un segundo Esc puede cerrar el <dialog> aunque se cancele el primero
    if (isPublishingRef.current) {
      dialogRef.current?.showModal();
      return;
    }
    setFormKey((key) => key + 1);
    // El toast de error vive dentro del <dialog>: se va con él
    setToast((current) => (current?.message.tone === "error" ? null : current));
  }

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
        onCancel={(event) => {
          if (isPublishingRef.current) event.preventDefault();
        }}
        onClose={handleDialogClose}
        className="m-0 h-dvh max-h-none w-full max-w-none overflow-hidden border-0 border-line bg-auth-bg p-0 text-ink backdrop:bg-ink/40 open:flex open:flex-col sm:mx-auto sm:mt-10 sm:mb-auto sm:h-fit sm:max-h-[calc(100dvh-80px)] sm:max-w-[580px] sm:rounded-3xl sm:border sm:shadow-[0_20px_50px_-24px_rgba(63,54,46,0.35)]"
      >
        <Suspense fallback={<NewPostFormSkeleton />}>
          <NewPostFormLoader
            key={formKey}
            optionsPromise={optionsPromise}
            titleId={titleId}
            isPending={isPending}
            onCancel={() => dialogRef.current?.close()}
            onPublish={publish}
          />
        </Suspense>
        {toast?.message.tone === "error" && (
          <Toast key={toast.id} message={toast.message} onClose={closeToast} />
        )}
      </dialog>
      {toast?.message.tone === "success" && (
        <Toast key={toast.id} message={toast.message} onClose={closeToast} />
      )}
    </NewPostDialogContext>
  );
}
