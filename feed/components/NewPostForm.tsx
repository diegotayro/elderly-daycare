"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { findPhotoConsentWarning } from "../find-photo-consent-warning";
import { MAX_BODY_LENGTH, MAX_TITLE_LENGTH } from "../new-post-limits";
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

const FIELD_ORDER: NewPostField[] = [
  "audience",
  "type",
  "title",
  "body",
  "photos",
];

const FOCUS_SELECTORS: Record<NewPostField, string> = {
  audience: "[data-audience-chip]",
  type: 'input[name="type"]',
  title: 'input[name="title"]',
  body: 'textarea[name="body"]',
  photos: "[data-photo-focus]",
};

function isNewPostField(name: string): name is NewPostField {
  return FIELD_ORDER.includes(name as NewPostField);
}

type NewPostFormProps = {
  options: NewPostOptions;
  titleId: string;
  isPending: boolean;
  onCancel: () => void;
  // El padre publica y, si el servidor rechaza campos, los devuelve por showFieldErrors
  onPublish: (
    input: NewPostInput,
    showFieldErrors: (errors: NewPostErrors) => void,
  ) => void;
};

export function NewPostForm({
  options,
  titleId,
  isPending,
  onCancel,
  onPublish,
}: NewPostFormProps) {
  const audienceLabelId = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const [audience, setAudience] = useState<AudienceSelection>({ kind: "none" });
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [errors, setErrors] = useState<NewPostErrors>({});
  // Los campos siguen deshabilitados mientras se publica: el foco se mueve al terminar
  const mustFocusInvalidField = useRef(false);
  const defaultRoomId = options.rooms[0]?.id ?? "";
  const hasTitleField = audience.kind === "room" || audience.kind === "daycare";
  const photoConsentWarning = findPhotoConsentWarning(
    audience,
    photos.length,
    options,
  );

  // Si el modal se abrió mientras cargaban las opciones, el foco inicial llega ahora
  useEffect(() => {
    const form = formRef.current;
    if (form?.closest("dialog")?.open) {
      form.querySelector<HTMLElement>("[data-audience-chip]")?.focus();
    }
  }, []);

  useEffect(() => {
    if (isPending || !mustFocusInvalidField.current) return;
    mustFocusInvalidField.current = false;
    const firstInvalidField = FIELD_ORDER.find((field) => errors[field]);
    if (firstInvalidField) {
      formRef.current
        ?.querySelector<HTMLElement>(FOCUS_SELECTORS[firstInvalidField])
        ?.focus();
    }
  }, [isPending, errors]);

  function showErrors(nextErrors: NewPostErrors) {
    mustFocusInvalidField.current = true;
    setErrors(nextErrors);
  }

  function clearError(field: NewPostField) {
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  function changeAudience(
    next: (current: AudienceSelection) => AudienceSelection,
  ) {
    setAudience(next);
    clearError("audience");
    clearError("photos");
  }

  function readInput(formData: FormData): NewPostInput {
    return {
      audience,
      type: String(formData.get("type") ?? ""),
      title: String(formData.get("title") ?? ""),
      body: String(formData.get("body") ?? ""),
      photoCount: photos.length,
    };
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isPending) return;
    const input = readInput(new FormData(event.currentTarget));
    const clientErrors = validateNewPost(input, {
      roomIds: options.rooms.map((room) => room.id),
      elderly: options.elderly,
      canPostToDaycare: options.canPostToDaycare,
    });

    if (Object.keys(clientErrors).length > 0) {
      showErrors(clientErrors);
      return;
    }
    setErrors({});
    onPublish(input, showErrors);
  }

  function handleChange(event: FormEvent<HTMLFormElement>) {
    const { name } = event.target as HTMLInputElement;
    if (isNewPostField(name)) clearError(name);
  }

  function addPhotos(incoming: File[]) {
    const { accepted, error } = selectPhotos(photos, incoming);
    setPhotos([...photos, ...accepted]);
    setPhotoError(error);
    clearError("photos");
  }

  function removePhoto(index: number) {
    setPhotos(photos.filter((_, photoIndex) => photoIndex !== index));
    setPhotoError(null);
    clearError("photos");
  }

  return (
    <form
      ref={formRef}
      noValidate
      onSubmit={handleSubmit}
      onChange={handleChange}
      className="flex min-h-0 flex-1 flex-col"
    >
      <header className="flex shrink-0 items-center justify-between border-b border-line px-[26px] py-5">
        <button
          type="button"
          onClick={onCancel}
          disabled={isPending}
          className="cursor-pointer text-[15px] font-bold text-muted-strong disabled:cursor-default disabled:opacity-50"
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
          disabled={isPending}
          className="cursor-pointer text-[15px] font-extrabold text-coral-strong disabled:cursor-default disabled:opacity-50"
        >
          {isPending ? "Publicando…" : "Publicar"}
        </button>
      </header>
      <fieldset
        disabled={isPending}
        className="m-0 flex min-h-0 min-w-0 flex-col gap-[22px] overflow-y-auto border-0 px-[26px] py-6"
      >
        <AudiencePicker
          labelId={audienceLabelId}
          error={errors.audience}
          elderly={options.elderly}
          rooms={options.rooms}
          canPostToDaycare={options.canPostToDaycare}
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
        {hasTitleField && (
          <div>
            <label
              htmlFor="title"
              className="mb-2.5 block text-xs font-extrabold tracking-[0.7px] text-muted-strong"
            >
              TÍTULO (opcional)
            </label>
            <input
              id="title"
              name="title"
              type="text"
              maxLength={MAX_TITLE_LENGTH}
              aria-invalid={errors.title ? true : undefined}
              aria-describedby={
                errors.title ? getFieldErrorId("title") : undefined
              }
              placeholder="Ej.: Paseo al parque"
              className={fieldControlClassName}
            />
            <FieldError fieldId="title" message={errors.title} />
          </div>
        )}
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
          error={errors.photos ?? photoError}
          warning={photoConsentWarning}
          onAdd={addPhotos}
          onRemove={removePhoto}
        />
      </fieldset>
    </form>
  );
}
