"use client";

import { useEffect, useRef, type ChangeEvent } from "react";
import { AlertIcon } from "@/shared/components/icons/AlertIcon";
import { CloseIcon } from "@/shared/components/icons/CloseIcon";
import { PlusIcon } from "@/shared/components/icons/PlusIcon";
import { MAX_PHOTOS } from "../new-post-limits";
import type { EditablePhoto } from "../types";
import { FieldError } from "./FieldError";

type PhotoSource = { file: File } | { url: string };

type PhotoThumbnailProps = {
  source: PhotoSource;
  position: number;
  isFocusTarget: boolean;
  onRemove: () => void;
};

function PhotoThumbnail({
  source,
  position,
  isFocusTarget,
  onRemove,
}: PhotoThumbnailProps) {
  const imageRef = useRef<HTMLImageElement>(null);

  const file = "file" in source ? source.file : null;
  const remoteUrl = "url" in source ? source.url : null;

  // La URL se asigna y se libera en el mismo efecto para no filtrar memoria
  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    if (imageRef.current) imageRef.current.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  return (
    <div className="relative size-24 flex-none overflow-hidden rounded-[14px] border border-line bg-photo">
      {/* eslint-disable-next-line @next/next/no-img-element -- vista previa local (blob:) o URL firmada */}
      <img
        ref={imageRef}
        src={remoteUrl ?? undefined}
        alt=""
        className="size-full object-cover"
      />
      <button
        type="button"
        data-photo-focus={isFocusTarget ? "" : undefined}
        onClick={onRemove}
        aria-label={`Quitar foto ${position}`}
        className="absolute top-1 right-1 flex size-6 cursor-pointer items-center justify-center rounded-full bg-ink/70 text-white"
      >
        <CloseIcon size={13} />
      </button>
    </div>
  );
}

type PhotoPickerProps = {
  keptPhotos: EditablePhoto[]; // fotos actuales de la publicación (solo en edición)
  photos: File[];
  error: string | null;
  warning: string | null;
  onAdd: (files: File[]) => void;
  onRemove: (index: number) => void;
  onRemoveKept: (photoId: string) => void;
};

export function PhotoPicker({
  keptPhotos,
  photos,
  error,
  warning,
  onAdd,
  onRemove,
  onRemoveKept,
}: PhotoPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const totalCount = keptPhotos.length + photos.length;

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    onAdd(Array.from(event.target.files ?? []));
    event.target.value = ""; // permite elegir de nuevo el mismo archivo
  }

  return (
    <div>
      <div className="mb-2.5 text-xs font-extrabold tracking-[0.7px] text-muted-strong">
        FOTOS
      </div>
      <div className="flex flex-wrap gap-3">
        {keptPhotos.map((photo, index) => (
          <PhotoThumbnail
            key={photo.id}
            source={{ url: photo.url }}
            position={index + 1}
            isFocusTarget={index === 0 && totalCount >= MAX_PHOTOS}
            onRemove={() => onRemoveKept(photo.id)}
          />
        ))}
        {photos.map((file, index) => (
          <PhotoThumbnail
            key={`${index}-${file.name}-${file.lastModified}`}
            source={{ file }}
            position={keptPhotos.length + index + 1}
            isFocusTarget={
              keptPhotos.length === 0 && index === 0 && totalCount >= MAX_PHOTOS
            }
            onRemove={() => onRemove(index)}
          />
        ))}
        {totalCount < MAX_PHOTOS && (
          <button
            type="button"
            data-photo-focus
            onClick={() => inputRef.current?.click()}
            className="flex size-24 flex-none cursor-pointer flex-col items-center justify-center gap-1.5 rounded-[14px] border-[1.5px] border-dashed border-photo-line bg-photo text-photo-ink"
          >
            <PlusIcon size={22} className="text-coral-link" />
            <span className="text-xs">Agregar</span>
          </button>
        )}
      </div>
      {warning && (
        <p
          role="status"
          className="mt-3 flex items-start gap-2 rounded-xl border border-[#F2DDB4] bg-[#FDF3E1] px-3.5 py-3 text-[13px] text-ink"
        >
          <AlertIcon size={16} className="mt-0.5 flex-none" />
          {warning}
        </p>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={handleChange}
      />
      <FieldError fieldId="photos" message={error} />
    </div>
  );
}
