"use client";

import { useState, useTransition } from "react";
import { DownloadIcon } from "@/shared/components/icons/DownloadIcon";
import { Toast } from "@/shared/components/toast/Toast";
import { getPhotoDownloadUrl } from "../actions/get-photo-download-url";
import { photoViewerMessages } from "../photo-viewer-messages";
import type { PhotoDownloadResult } from "../types";

export const VIEWER_BUTTON_CLASS_NAME =
  "group flex size-11 cursor-pointer items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-coral disabled:cursor-default disabled:opacity-40";

export const VIEWER_BUTTON_CIRCLE_CLASS_NAME =
  "flex size-[42px] items-center justify-center rounded-full bg-white/14 text-white transition-colors group-enabled:group-hover:bg-white/24 motion-reduce:transition-none";

// Descarga sin salir de la página: un <a download> temporal con la URL firmada
function downloadFromUrl(url: string) {
  const link = document.createElement("a");
  link.href = url;
  link.download = "";
  document.body.append(link);
  link.click();
  link.remove();
}

type PhotoDownloadButtonProps = {
  postId: string;
  position: number;
};

export function PhotoDownloadButton({
  postId,
  position,
}: PhotoDownloadButtonProps) {
  const [isPending, startTransition] = useTransition();
  // La key reinicia el temporizador si el toast se repite
  const [errorToastId, setErrorToastId] = useState<number | null>(null);

  function download() {
    startTransition(async () => {
      const result = await getPhotoDownloadUrl(postId, position).catch(
        (): PhotoDownloadResult => ({ status: "error" }), // fallo de red
      );
      if (result.status === "ok") {
        downloadFromUrl(result.url);
      } else {
        setErrorToastId((id) => (id ?? 0) + 1);
      }
    });
  }

  return (
    <>
      <button
        type="button"
        aria-label={photoViewerMessages.download}
        title={photoViewerMessages.download}
        disabled={isPending}
        onClick={download}
        className={VIEWER_BUTTON_CLASS_NAME}
      >
        <span className={VIEWER_BUTTON_CIRCLE_CLASS_NAME}>
          <DownloadIcon size={19} />
        </span>
      </button>
      {errorToastId !== null && (
        <Toast
          key={errorToastId}
          message={{
            tone: "error",
            title: photoViewerMessages.downloadErrorTitle,
            description: photoViewerMessages.downloadErrorDescription,
          }}
          onClose={() => setErrorToastId(null)}
        />
      )}
    </>
  );
}
