"use client";

import { useId, useState, type FormEvent } from "react";
import { MAX_BODY_LENGTH } from "../new-post-limits";
import { selectPhotos } from "../select-photos";
import { toggleAudience } from "../toggle-audience";
import { validateNewPost } from "../validate-new-post";
import type {
  AudienceSelection,
  NewPostErrors,
  NewPostField,
  NewPostInput,
  NewPostOptions,
} from "../types";
import {
  fieldControlClassName,
  getFieldErrorId,
} from "@/elderly/components/FormField";
import { FieldError } from "./FieldError";
import { AudiencePicker } from "./AudiencePicker";
import { PhotoPicker } from "./PhotoPicker";
import { PostTypePicker } from "./PostTypePicker";

const FIELD_ORDER: NewPostField[] = ["audience", "type", "body"];

const FOCUS_SELECTORS: Record<NewPostField, string> = {
  audience: "[data-audience-chip]",
  type: 'input[name="type"]',
  body: 'textarea[name="body"]',
};

function isNewPostField(name: string): name is NewPostField {
  return FIELD_ORDER.includes(name as NewPostField);
}

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
  const [errors, setErrors] = useState<NewPostErrors>({});
  const defaultRoomId = options.rooms[0]?.id ?? "";

  function clearError(field: NewPostField) {
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  function changeAudience(
    next: (current: AudienceSelection) => AudienceSelection,
  ) {
    setAudience(next);
    clearError("audience");
  }

  function readInput(formData: FormData): NewPostInput {
    return {
      audience,
      type: String(formData.get("type") ?? ""),
      body: String(formData.get("body") ?? ""),
    };
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const nextErrors = validateNewPost(readInput(new FormData(form)), {
      roomIds: options.rooms.map((room) => room.id),
      elderlyIds: options.elderly.map((elderly) => elderly.id),
    });
    setErrors(nextErrors);

    const firstInvalidField = FIELD_ORDER.find((field) => nextErrors[field]);
    if (firstInvalidField) {
      form
        .querySelector<HTMLElement>(FOCUS_SELECTORS[firstInvalidField])
        ?.focus();
    }
  }

  function handleChange(event: FormEvent<HTMLFormElement>) {
    const { name } = event.target as HTMLInputElement;
    if (isNewPostField(name)) clearError(name);
  }

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
    <form
      noValidate
      onSubmit={handleSubmit}
      onChange={handleChange}
      className="flex min-h-0 flex-1 flex-col"
    >
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
          error={errors.audience}
          elderly={options.elderly}
          rooms={options.rooms}
          selection={audience}
          onToggle={(chip) =>
            changeAudience((current) =>
              toggleAudience(current, chip, defaultRoomId),
            )
          }
          onRoomChange={(roomId) =>
            changeAudience(() => ({ kind: "room", roomId }))
          }
        />
        <PostTypePicker error={errors.type} />
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
            aria-invalid={errors.body ? true : undefined}
            aria-describedby={errors.body ? getFieldErrorId("body") : undefined}
            placeholder="Cuenta cómo le fue hoy…"
            className={`${fieldControlClassName} min-h-[120px] resize-y leading-normal`}
          />
          <FieldError fieldId="body" message={errors.body} />
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
