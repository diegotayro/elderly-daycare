"use client";

import { useEffect, useRef, useState } from "react";

// Lógica de scroll compartida por el carrusel y el visor de fotos
export function usePhotoTrack(initialIndex = 0) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(initialIndex);

  useEffect(() => {
    const track = trackRef.current;
    if (!track || initialIndex === 0) return;
    track.scrollLeft = initialIndex * track.clientWidth;
    // Solo posiciona el track al montar
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  return { trackRef, activeIndex, updateActiveIndex, goTo };
}
