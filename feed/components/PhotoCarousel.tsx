"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { ChevronLeftIcon } from "@/shared/components/icons/ChevronLeftIcon";
import { ChevronRightIcon } from "@/shared/components/icons/ChevronRightIcon";
import { photoViewerMessages } from "../photo-viewer-messages";
import type { FeedPhoto, PhotoViewerPost } from "../types";
import { usePhotoTrack } from "../use-photo-track";
import { PhotoViewer } from "./PhotoViewer";

const ARROW_REVEAL_CLASS_NAME =
  "absolute top-1/2 hidden -translate-y-1/2 transition-opacity motion-reduce:transition-none [@media(hover:hover)]:block [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-focus-within:opacity-100 [@media(hover:hover)]:group-hover:opacity-100";

const ARROW_BUTTON_CLASS_NAME =
  "flex size-9 cursor-pointer items-center justify-center rounded-full bg-white/80 text-ink shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral disabled:cursor-default disabled:opacity-40";

type PhotoSlideProps = {
  photo: FeedPhoto;
  position: number;
  total: number;
  onOpen: (trigger: HTMLButtonElement) => void;
};

function PhotoSlide({ photo, position, total, onOpen }: PhotoSlideProps) {
  // La primera foto de cada carrusel es la visible: carga sin esperar; las demás, diferidas
  const loading = position === 1 ? "eager" : "lazy";
  const { url, width, height } = photo;

  return (
    <button
      type="button"
      aria-label={photoViewerMessages.openPhotoLabel(position, total)}
      onClick={(event) => onOpen(event.currentTarget)}
      className="relative h-full w-full flex-none cursor-pointer snap-center focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-coral-strong"
    >
      {width && height ? (
        <Image
          src={url}
          alt=""
          width={width}
          height={height}
          unoptimized
          loading={loading}
          className="size-full object-cover"
        />
      ) : (
        <Image
          src={url}
          alt=""
          fill
          unoptimized
          loading={loading}
          className="object-cover"
        />
      )}
    </button>
  );
}

type PhotoCarouselProps = {
  photos: FeedPhoto[];
  viewerPost: PhotoViewerPost;
  sizeClassName?: string; // margen y alto del carrusel
};

export function PhotoCarousel({
  photos,
  viewerPost,
  sizeClassName = "mt-3.5 h-40 lg:h-[200px]",
}: PhotoCarouselProps) {
  const { trackRef, activeIndex, updateActiveIndex, goTo } = usePhotoTrack();
  const hasSeveralPhotos = photos.length > 1;
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  function openViewer(index: number, trigger: HTMLButtonElement) {
    triggerRef.current = trigger;
    setViewerIndex(index);
  }

  // Safari no enfoca el botón al hacer clic: el foco vuelve a la foto que abrió el visor
  function closeViewer() {
    setViewerIndex(null);
    triggerRef.current?.focus();
  }

  return (
    <>
      <div
        role="region"
        aria-roledescription="carrusel"
        aria-label="Fotos de la publicación"
        className={`group relative overflow-hidden rounded-2xl bg-photo ${sizeClassName}`}
      >
        <div
          ref={trackRef}
          onScroll={updateActiveIndex}
          className="flex h-full snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {photos.map((photo, index) => (
            <PhotoSlide
              key={photo.url}
              photo={photo}
              position={index + 1}
              total={photos.length}
              onOpen={(trigger) => openViewer(index, trigger)}
            />
          ))}
        </div>

        {hasSeveralPhotos && (
          <>
            <span className={`${ARROW_REVEAL_CLASS_NAME} left-2`}>
              <button
                type="button"
                aria-label="Foto anterior"
                disabled={activeIndex === 0}
                onClick={() => goTo(activeIndex - 1)}
                className={ARROW_BUTTON_CLASS_NAME}
              >
                <ChevronLeftIcon size={18} />
              </button>
            </span>
            <span className={`${ARROW_REVEAL_CLASS_NAME} right-2`}>
              <button
                type="button"
                aria-label="Foto siguiente"
                disabled={activeIndex === photos.length - 1}
                onClick={() => goTo(activeIndex + 1)}
                className={ARROW_BUTTON_CLASS_NAME}
              >
                <ChevronRightIcon size={18} />
              </button>
            </span>
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 bottom-2.5 flex justify-center gap-1.5"
            >
              {photos.map((photo, index) => (
                <span
                  key={photo.url}
                  className={`size-1.5 rounded-full bg-white ${index === activeIndex ? "" : "opacity-50"}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
      {viewerIndex !== null && (
        <PhotoViewer
          photos={photos}
          initialIndex={viewerIndex}
          post={viewerPost}
          onClose={closeViewer}
        />
      )}
    </>
  );
}
