"use client";

import type { ReactNode } from "react";
import { useNewPostDialog } from "./NewPostDialogProvider";

type NewPostTriggerProps = {
  className: string;
  "aria-label"?: string;
  children: ReactNode;
};

export function NewPostTrigger({
  className,
  "aria-label": ariaLabel,
  children,
}: NewPostTriggerProps) {
  const { open } = useNewPostDialog();

  return (
    <button
      type="button"
      onClick={open}
      aria-label={ariaLabel}
      className={className}
    >
      {children}
    </button>
  );
}
