"use client";

import { useEffect, useRef, type ChangeEvent } from "react";
import { getFieldErrorId } from "@/elderly/components/FormField";
import { CloseIcon } from "@/shared/components/icons/CloseIcon";
import { PlusIcon } from "@/shared/components/icons/PlusIcon";
import { MAX_PHOTOS } from "../new-post-limits";

type PhotoThumbnailProps = {
  file: File;
  position: number;
  onRemove: () => void;
};

function PhotoThumbnail({ file, position, onRemove }: PhotoThumbnailProps) {
  const imageRef = useRef<HTMLImageElement>(null);

  // La URL se asigna y se libera en el mismo efecto para no filtrar memoria
  useEffect(() => {
    const url = URL.createObjectURL(file);
    if (imageRef.current) imageRef.current.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  return (
    <div className="relative size-24 flex-none overflow-hidden rounded-[14px] border border-line bg-photo">
      {/* eslint-disable-next-line @next/next/no-img-element -- vista previa local (blob:) */}
      <img ref={imageRef} alt="" className="size-full object-cover" />
      <button
        type="button"
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
  photos: File[];
  error: string | null;
  onAdd: (files: File[]) => void;
  onRemove: (index: number) => void;
};

export function PhotoPicker({
  photos,
  error,
  onAdd,
  onRemove,
}: PhotoPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);

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
        {photos.map((file, index) => (
          <PhotoThumbnail
            key={`${index}-${file.name}-${file.lastModified}`}
            file={file}
            position={index + 1}
            onRemove={() => onRemove(index)}
          />
        ))}
        {photos.length < MAX_PHOTOS && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex size-24 flex-none cursor-pointer flex-col items-center justify-center gap-1.5 rounded-[14px] border-[1.5px] border-dashed border-photo-line bg-photo text-photo-ink"
          >
            <PlusIcon size={22} className="text-coral-link" />
            <span className="text-xs">Agregar</span>
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={handleChange}
      />
      {error && (
        <p
          id={getFieldErrorId("photos")}
          className="mt-1.5 text-[13px] font-bold text-error"
        >
          {error}
        </p>
      )}
    </div>
  );
}
