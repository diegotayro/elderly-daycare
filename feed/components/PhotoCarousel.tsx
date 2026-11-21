"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { ChevronLeftIcon } from "@/shared/components/icons/ChevronLeftIcon";
import { ChevronRightIcon } from "@/shared/components/icons/ChevronRightIcon";
import type { FeedPhoto } from "../types";

const ARROW_REVEAL_CLASS_NAME =
  "absolute top-1/2 hidden -translate-y-1/2 transition-opacity motion-reduce:transition-none [@media(hover:hover)]:block [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-focus-within:opacity-100 [@media(hover:hover)]:group-hover:opacity-100";

const ARROW_BUTTON_CLASS_NAME =
  "flex size-9 cursor-pointer items-center justify-center rounded-full bg-white/80 text-ink shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral disabled:cursor-default disabled:opacity-40";

type PhotoSlideProps = {
  photo: FeedPhoto;
  position: number;
  total: number;
};

function PhotoSlide({ photo, position, total }: PhotoSlideProps) {
  // La primera foto de cada carrusel es la visible: carga sin esperar; las demás, diferidas
  const loading = position === 1 ? "eager" : "lazy";
  const alt = `Foto ${position} de ${total}`;
  const { url, width, height } = photo;

  return (
    <div className="relative h-full w-full flex-none snap-center">
      {width && height ? (
        <Image
          src={url}
          alt={alt}
          width={width}
          height={height}
          unoptimized
          loading={loading}
          className="size-full object-cover"
        />
      ) : (
        <Image
          src={url}
          alt={alt}
          fill
          unoptimized
          loading={loading}
          className="object-cover"
        />
      )}
    </div>
  );
}

type PhotoCarouselProps = {
  photos: FeedPhoto[];
  sizeClassName?: string; // margen y alto del carrusel
};

export function PhotoCarousel({
  photos,
  sizeClassName = "mt-3.5 h-40 lg:h-[200px]",
}: PhotoCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const hasSeveralPhotos = photos.length > 1;

  function updateActiveIndex() {
    const track = trackRef.current;
    if (!track) return;
    setActiveIndex(Math.round(track.scrollLeft / track.clientWidth));
  }

  function goTo(index: number) {
    const track = trackRef.current;
    if (!track) return;
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    track.scrollTo({
      left: index * track.clientWidth,
      behavior: prefersReducedMotion ? "instant" : "smooth",
    });
  }

  return (
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
  );
}
