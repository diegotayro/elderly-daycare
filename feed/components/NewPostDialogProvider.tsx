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
import type { ToastMessage } from "@/shared/components/toast/types";
import { newPostMessages as messages } from "../new-post-messages";
import { publishPost } from "../publish-post";
import type { CreatePostResult, NewPostErrors, NewPostOptions } from "../types";
import { NewPostForm, type PostSubmission } from "./NewPostForm";
import {
  PostFormDialog,
  PostFormSkeleton,
  type PostFormDialogHandle,
} from "./PostFormDialog";

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

type NewPostFormLoaderProps = {
  optionsPromise: Promise<NewPostOptions>;
  titleId: string;
  isPending: boolean;
  onCancel: () => void;
  onSubmit: (
    submission: PostSubmission,
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
  const dialogRef = useRef<PostFormDialogHandle>(null);
  const titleId = useId();
  // Cambiar la key remonta el formulario: queda vacío y sin errores
  const [formKey, setFormKey] = useState(0);
  const [isPending, startTransition] = useTransition();
  const isPublishingRef = useRef(false);

  function publish(
    { input, files }: PostSubmission,
    showFieldErrors: (errors: NewPostErrors) => void,
  ) {
    isPublishingRef.current = true;
    startTransition(async () => {
      const result = await publishPost(input, files).catch(
        (): CreatePostResult => ({ status: "error" }), // fallo de red
      );
      isPublishingRef.current = false;
      if (result.status === "invalid") {
        showFieldErrors(result.errors);
      } else if (result.status === "error") {
        dialogRef.current?.showToast(errorToast);
      } else {
        dialogRef.current?.close();
        dialogRef.current?.showToast(successToast);
      }
    });
  }

  return (
    <NewPostDialogContext value={{ open: () => dialogRef.current?.open() }}>
      {children}
      <PostFormDialog
        handleRef={dialogRef}
        titleId={titleId}
        busyRef={isPublishingRef}
        onClosed={() => setFormKey((key) => key + 1)}
      >
        <Suspense fallback={<PostFormSkeleton />}>
          <NewPostFormLoader
            key={formKey}
            optionsPromise={optionsPromise}
            titleId={titleId}
            isPending={isPending}
            onCancel={() => dialogRef.current?.close()}
            onSubmit={publish}
          />
        </Suspense>
      </PostFormDialog>
    </NewPostDialogContext>
  );
}
