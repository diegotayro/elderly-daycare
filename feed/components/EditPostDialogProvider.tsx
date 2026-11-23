"use client";

import { useRouter } from "next/navigation";
import {
  createContext,
  Suspense,
  use,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import type { ToastMessage } from "@/shared/components/toast/types";
import { getPostForEdit } from "../actions/get-post-for-edit";
import { editPostMessages as messages } from "../edit-post-messages";
import { savePostEdit } from "../save-post-edit";
import type {
  GetPostForEditResult,
  NewPostErrors,
  PostForEdit,
  UpdatePostResult,
} from "../types";
import { NewPostForm, type PostSubmission } from "./NewPostForm";
import {
  PostFormDialog,
  PostFormSkeleton,
  type PostFormDialogHandle,
} from "./PostFormDialog";

const successToast: ToastMessage = {
  tone: "success",
  title: messages.saveSuccessTitle,
  description: messages.saveSuccessDescription,
};

const hasHistoryToast: ToastMessage = {
  tone: "error",
  title: messages.hasHistoryTitle,
  description: messages.hasHistoryDescription,
};

const saveErrorToast: ToastMessage = {
  tone: "error",
  title: messages.saveErrorTitle,
  description: messages.saveErrorDescription,
};

const loadErrorToast: ToastMessage = {
  tone: "error",
  title: messages.loadErrorTitle,
  description: messages.loadErrorDescription,
};

type EditPostDialogContextValue = { open: (postId: string) => void };

const EditPostDialogContext = createContext<EditPostDialogContextValue | null>(
  null,
);

export function useEditPostDialog(): EditPostDialogContextValue {
  const context = useContext(EditPostDialogContext);
  if (!context) {
    throw new Error(
      "useEditPostDialog must be used inside EditPostDialogProvider",
    );
  }
  return context;
}

type EditPostFormLoaderProps = {
  loadPromise: Promise<GetPostForEditResult>;
  titleId: string;
  isPending: boolean;
  onCancel: () => void;
  onLoadFailed: (status: "has-history" | "error") => void;
  onSave: (
    post: PostForEdit,
    submission: PostSubmission,
    showFieldErrors: (errors: NewPostErrors) => void,
  ) => void;
};

function EditPostFormLoader({
  loadPromise,
  titleId,
  isPending,
  onCancel,
  onLoadFailed,
  onSave,
}: EditPostFormLoaderProps) {
  const result = use(loadPromise);

  useEffect(() => {
    if (result.status !== "ok") onLoadFailed(result.status);
    // onLoadFailed cambia en cada render; solo importa el resultado de la carga
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result]);

  if (result.status !== "ok") return <PostFormSkeleton />;
  return (
    <NewPostForm
      options={result.options}
      edit={result.post}
      titleId={titleId}
      isPending={isPending}
      onCancel={onCancel}
      onSubmit={(submission, showFieldErrors) =>
        onSave(result.post, submission, showFieldErrors)
      }
    />
  );
}

export function EditPostDialogProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const dialogRef = useRef<PostFormDialogHandle>(null);
  const titleId = useId();
  const [loadPromise, setLoadPromise] =
    useState<Promise<GetPostForEditResult> | null>(null);
  const [isPending, startTransition] = useTransition();
  const isSavingRef = useRef(false);

  function open(postId: string) {
    setLoadPromise(
      getPostForEdit(postId).catch(
        (): GetPostForEditResult => ({ status: "error" }), // fallo de red
      ),
    );
    dialogRef.current?.open();
  }

  function closeWithToast(message: ToastMessage) {
    dialogRef.current?.close();
    dialogRef.current?.showToast(message);
  }

  function handleLoadFailed(status: "has-history" | "error") {
    if (status === "has-history") {
      closeWithToast(hasHistoryToast);
      router.refresh();
    } else {
      closeWithToast(loadErrorToast);
    }
  }

  function handleResult(
    result: UpdatePostResult,
    showFieldErrors: (errors: NewPostErrors) => void,
  ) {
    switch (result.status) {
      case "invalid":
        showFieldErrors(result.errors);
        break;
      case "error":
        dialogRef.current?.showToast(saveErrorToast);
        break;
      case "has-history":
        closeWithToast(hasHistoryToast);
        router.refresh();
        break;
      case "ok":
        closeWithToast(successToast);
        break;
    }
  }

  function save(
    post: PostForEdit,
    { input, files, removedPhotoIds }: PostSubmission,
    showFieldErrors: (errors: NewPostErrors) => void,
  ) {
    isSavingRef.current = true;
    startTransition(async () => {
      const result = await savePostEdit({
        post,
        input,
        files,
        removedPhotoIds,
      }).catch((): UpdatePostResult => ({ status: "error" }));
      isSavingRef.current = false;
      handleResult(result, showFieldErrors);
    });
  }

  return (
    <EditPostDialogContext value={{ open }}>
      {children}
      <PostFormDialog
        handleRef={dialogRef}
        titleId={titleId}
        busyRef={isSavingRef}
        onClosed={() => setLoadPromise(null)}
      >
        {loadPromise && (
          <Suspense fallback={<PostFormSkeleton />}>
            <EditPostFormLoader
              loadPromise={loadPromise}
              titleId={titleId}
              isPending={isPending}
              onCancel={() => dialogRef.current?.close()}
              onLoadFailed={handleLoadFailed}
              onSave={save}
            />
          </Suspense>
        )}
      </PostFormDialog>
    </EditPostDialogContext>
  );
}
