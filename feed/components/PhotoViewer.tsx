"use client";

import Image from "next/image";
import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
} from "react";
import { ChevronLeftIcon } from "@/shared/components/icons/ChevronLeftIcon";
import { ChevronRightIcon } from "@/shared/components/icons/ChevronRightIcon";
import { CloseIcon } from "@/shared/components/icons/CloseIcon";
import { photoViewerMessages } from "../photo-viewer-messages";
import type { FeedPhoto, PhotoViewerPost } from "../types";
import { usePhotoTrack } from "../use-photo-track";
import {
  PhotoDownloadButton,
  VIEWER_BUTTON_CIRCLE_CLASS_NAME,
  VIEWER_BUTTON_CLASS_NAME,
} from "./PhotoDownloadButton";

// Lo que no cierra el visor al hacer clic: la foto y los controles
const CONTROL_SELECTOR = "[data-viewer-control]";

const ARROW_CLASS_NAME = `${VIEWER_BUTTON_CLASS_NAME} absolute top-1/2 -translate-y-1/2`;

const FALLBACK_PHOTO_SIZE = { width: 1200, height: 900 };

type ViewerSlideProps = {
  photo: FeedPhoto;
  hasFailed: boolean;
  onError: () => void;
};

function ViewerSlide({ photo, hasFailed, onError }: ViewerSlideProps) {
  const { url, width, height } = photo;

  return (
    <div className="flex h-full w-full flex-none snap-center items-center justify-center px-[26px]">
      {hasFailed ? (
        <p
          data-viewer-control
          className="m-0 max-w-[420px] rounded-[20px] border-[1.5px] border-dashed border-white/16 bg-white/5 px-6 py-10 text-center text-[15px] text-white/70"
        >
          {photoViewerMessages.loadError}
        </p>
      ) : (
        <Image
          data-viewer-control
          src={url}
          alt=""
          width={width ?? FALLBACK_PHOTO_SIZE.width}
          height={height ?? FALLBACK_PHOTO_SIZE.height}
          unoptimized
          onError={onError}
          className="h-auto max-h-full w-auto max-w-[min(100%,760px)] rounded-[20px] object-contain"
        />
      )}
    </div>
  );
}

type PhotoViewerProps = {
  photos: FeedPhoto[];
  initialIndex: number;
  post: PhotoViewerPost;
  onClose: () => void;
};

export function PhotoViewer({
  photos,
  initialIndex,
  post,
  onClose,
}: PhotoViewerProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const startedOnBackgroundRef = useRef(false);
  const [failedIndexes, setFailedIndexes] = useState<ReadonlySet<number>>(
    new Set(),
  );
  const total = photos.length;
  const hasSeveralPhotos = total > 1;

  // Debe ir antes del hook: el track solo mide bien con el <dialog> abierto
  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  const { trackRef, activeIndex, updateActiveIndex, goTo } =
    usePhotoTrack(initialIndex);

  useEffect(() => {
    const root = document.documentElement;
    const previousOverflow = root.style.overflow;
    root.style.overflow = "hidden";
    return () => {
      root.style.overflow = previousOverflow;
    };
  }, []);

  function markAsFailed(index: number) {
    setFailedIndexes((current) => new Set(current).add(index));
  }

  function isBackground(target: EventTarget) {
    return !(target as Element).closest(CONTROL_SELECTOR);
  }

  // Un swipe que termina fuera de la foto no cuenta: el clic debe empezar y terminar en el fondo
  function handleClick(event: MouseEvent) {
    const isBackgroundClick =
      startedOnBackgroundRef.current && isBackground(event.target);
    startedOnBackgroundRef.current = false;
    if (isBackgroundClick) dialogRef.current?.close();
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === "ArrowLeft" && activeIndex > 0) goTo(activeIndex - 1);
    if (event.key === "ArrowRight" && activeIndex < total - 1) {
      goTo(activeIndex + 1);
    }
  }

  return (
    <dialog
      ref={dialogRef}
      aria-label={photoViewerMessages.viewerLabel(activeIndex + 1, total)}
      onClose={onClose}
      onPointerDown={(event) => {
        startedOnBackgroundRef.current = isBackground(event.target);
      }}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className="m-0 h-dvh max-h-none w-full max-w-none overflow-hidden border-0 bg-viewer p-0 text-white backdrop:bg-viewer open:flex open:flex-col"
    >
      <header className="grid grid-cols-[44px_1fr_44px] items-center px-[14px] py-[14px] sm:px-[26px] sm:py-[22px]">
        <button
          type="button"
          data-viewer-control
          aria-label={photoViewerMessages.close}
          title={photoViewerMessages.close}
          onClick={() => dialogRef.current?.close()}
          className={VIEWER_BUTTON_CLASS_NAME}
        >
          <span className={VIEWER_BUTTON_CIRCLE_CLASS_NAME}>
            <CloseIcon size={20} />
          </span>
        </button>
        <div className="min-w-0 text-center">
          <div className="truncate font-display text-base font-semibold">
            {post.heading}
          </div>
          <div className="truncate text-[13px] text-white/60">
            {post.subtitle}
          </div>
        </div>
        <div data-viewer-control>
          <PhotoDownloadButton
            postId={post.postId}
            position={photos[activeIndex].position}
          />
        </div>
      </header>

      <div className="relative min-h-0 flex-1">
        <div
          ref={trackRef}
          onScroll={updateActiveIndex}
          className="flex h-full snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {photos.map((photo, index) => (
            <ViewerSlide
              key={photo.url}
              photo={photo}
              hasFailed={failedIndexes.has(index)}
              onError={() => markAsFailed(index)}
            />
          ))}
        </div>

        {hasSeveralPhotos && (
          <>
            <button
              type="button"
              data-viewer-control
              aria-label={photoViewerMessages.previousPhoto}
              disabled={activeIndex === 0}
              onClick={() => goTo(activeIndex - 1)}
              className={`${ARROW_CLASS_NAME} left-1.5 sm:left-4`}
            >
              <span className={VIEWER_BUTTON_CIRCLE_CLASS_NAME}>
                <ChevronLeftIcon size={20} />
              </span>
            </button>
            <button
              type="button"
              data-viewer-control
              aria-label={photoViewerMessages.nextPhoto}
              disabled={activeIndex === total - 1}
              onClick={() => goTo(activeIndex + 1)}
              className={`${ARROW_CLASS_NAME} right-1.5 sm:right-4`}
            >
              <span className={VIEWER_BUTTON_CIRCLE_CLASS_NAME}>
                <ChevronRightIcon size={20} />
              </span>
            </button>
          </>
        )}
      </div>

      <footer className="px-[26px] pt-4 pb-[34px] text-center">
        {hasSeveralPhotos && (
          <p
            aria-live="polite"
            className="m-0 mb-2 text-[13px] font-bold text-white/60"
          >
            {photoViewerMessages.counter(activeIndex + 1, total)}
          </p>
        )}
        <div className="mx-auto max-h-[20dvh] max-w-[560px] overflow-y-auto">
          <p
            data-viewer-control
            className="m-0 text-[15px] leading-[1.55] break-words whitespace-pre-line text-white/85"
          >
            {post.caption}
          </p>
        </div>
      </footer>
    </dialog>
  );
}
