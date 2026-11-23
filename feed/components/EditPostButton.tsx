"use client";

import { useEditPostDialog } from "./EditPostDialogProvider";

type EditPostButtonProps = { postId: string };

export function EditPostButton({ postId }: EditPostButtonProps) {
  const { open } = useEditPostDialog();

  return (
    <button
      type="button"
      onClick={() => open(postId)}
      className="cursor-pointer text-sm font-extrabold text-coral-link"
    >
      Editar
    </button>
  );
}
