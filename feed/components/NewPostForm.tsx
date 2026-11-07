"use client";

import { useId, useState } from "react";
import { MAX_BODY_LENGTH } from "../new-post-limits";
import { selectPhotos } from "../select-photos";
import { toggleAudience } from "../toggle-audience";
import type { AudienceSelection, NewPostOptions } from "../types";
import { fieldControlClassName } from "@/elderly/components/FormField";
import { AudiencePicker } from "./AudiencePicker";
import { PhotoPicker } from "./PhotoPicker";
import { PostTypePicker } from "./PostTypePicker";

type NewPostFormProps = {
  options: NewPostOptions;
  titleId: string;
  onCancel: () => void;
};

export function NewPostForm({ options, titleId, onCancel }: NewPostFormProps) {
  const audienceLabelId = useId();
  const [audience, setAudience] = useState<AudienceSelection>({ kind: "none" });
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const defaultRoomId = options.rooms[0]?.id ?? "";

  function addPhotos(incoming: File[]) {
    const { accepted, error } = selectPhotos(photos, incoming);
    setPhotos([...photos, ...accepted]);
    setPhotoError(error);
  }

  function removePhoto(index: number) {
    setPhotos(photos.filter((_, photoIndex) => photoIndex !== index));
    setPhotoError(null);
  }

  return (
    <form noValidate className="flex min-h-0 flex-1 flex-col">
      <header className="flex shrink-0 items-center justify-between border-b border-line px-[26px] py-5">
        <button
          type="button"
          onClick={onCancel}
          className="cursor-pointer text-[15px] font-bold text-muted-strong"
        >
          Cancelar
        </button>
        <h2
          id={titleId}
          className="m-0 font-display text-lg leading-[normal] font-semibold text-ink"
        >
          Nueva publicación
        </h2>
        <button
          type="submit"
          className="cursor-pointer text-[15px] font-extrabold text-coral-strong"
        >
          Publicar
        </button>
      </header>
      <div className="flex min-h-0 flex-col gap-[22px] overflow-y-auto px-[26px] py-6">
        <AudiencePicker
          labelId={audienceLabelId}
          elderly={options.elderly}
          rooms={options.rooms}
          selection={audience}
          onToggle={(chip) =>
            setAudience((current) =>
              toggleAudience(current, chip, defaultRoomId),
            )
          }
          onRoomChange={(roomId) => setAudience({ kind: "room", roomId })}
        />
        <PostTypePicker />
        <div>
          <label
            htmlFor="body"
            className="mb-2.5 block text-xs font-extrabold tracking-[0.7px] text-muted-strong"
          >
            DESCRIPCIÓN
          </label>
          <textarea
            id="body"
            name="body"
            maxLength={MAX_BODY_LENGTH}
            placeholder="Cuenta cómo le fue hoy…"
            className={`${fieldControlClassName} min-h-[120px] resize-y leading-normal`}
          />
        </div>
        <PhotoPicker
          photos={photos}
          error={photoError}
          onAdd={addPhotos}
          onRemove={removePhoto}
        />
      </div>
    </form>
  );
}
