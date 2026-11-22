"use client";

import Image from "next/image";
import { useState } from "react";

type AvatarProps = {
  initial: string;
  size?: number;
  fontSize?: number;
  colorClassName?: string;
  colors?: { bg: string; fg: string }; // colores libres; reemplaza a colorClassName
  photoUrl?: string | null; // url firmada; si falta o falla, se ven las iniciales
};

export function Avatar({
  initial,
  size = 38,
  fontSize = 16,
  colorClassName = "bg-coral text-white",
  colors,
  photoUrl,
}: AvatarProps) {
  const [failedPhotoUrl, setFailedPhotoUrl] = useState<string | null>(null);
  const showPhoto = photoUrl && photoUrl !== failedPhotoUrl;

  return (
    <div
      className={`relative flex flex-none items-center justify-center overflow-hidden rounded-full font-display font-semibold ${colors ? "" : colorClassName}`}
      style={{
        width: size,
        height: size,
        fontSize,
        ...(colors && { backgroundColor: colors.bg, color: colors.fg }),
      }}
    >
      {showPhoto ? (
        <Image
          src={photoUrl}
          alt=""
          fill
          sizes={`${size}px`}
          unoptimized
          onError={() => setFailedPhotoUrl(photoUrl)}
          className="object-cover"
        />
      ) : (
        initial
      )}
    </div>
  );
}
