"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { detectPostChanges, type PostFormFields } from "../detect-post-changes";
import { editPostMessages } from "../edit-post-messages";
import { findPhotoConsentWarning } from "../find-photo-consent-warning";
import { MAX_BODY_LENGTH, MAX_TITLE_LENGTH } from "../new-post-limits";
import { selectPhotos } from "../select-photos";
import { toggleAudience } from "../toggle-audience";
import { validateNewPost } from "../validate-new-post";
import type {
  AudienceSelection,
  EditablePhoto,
  NewPostErrors,
  NewPostField,
  NewPostInput,
  NewPostOptions,
  PostForEdit,
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

export type PostSubmission = {
  input: NewPostInput; // photoCount = fotos que quedarán (actuales − quitadas + nuevas)
  files: File[]; // fotos nuevas
  removedPhotoIds: string[]; // solo en edición
};

type NewPostFormProps = {
  options: NewPostOptions;
  titleId: string;
  isPending: boolean;
  onCancel: () => void;
  // El padre guarda y, si el servidor rechaza campos, los devuelve por showFieldErrors
  onSubmit: (
    submission: PostSubmission,
    showFieldErrors: (errors: NewPostErrors) => void,
  ) => void;
  // Con `edit` el formulario parte de la publicación y se comporta como "Editar publicación"
  edit?: PostForEdit;
};

export function NewPostForm({
  options,
  titleId,
  isPending,
  onCancel,
  onSubmit,
  edit,
}: NewPostFormProps) {
  const audienceLabelId = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const [audience, setAudience] = useState<AudienceSelection>(
    edit?.input.audience ?? { kind: "none" },
  );
  const [fields, setFields] = useState<PostFormFields>({
    type: edit?.input.type ?? "",
    title: edit?.input.title ?? "",
    body: edit?.input.body ?? "",
  });
  const [keptPhotos, setKeptPhotos] = useState<EditablePhoto[]>(
    edit?.photos ?? [],
  );
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [errors, setErrors] = useState<NewPostErrors>({});
  // Los campos siguen deshabilitados mientras se publica: el foco se mueve al terminar
  const mustFocusInvalidField = useRef(false);
  const defaultRoomId = options.rooms[0]?.id ?? "";
  const hasTitleField = audience.kind === "room" || audience.kind === "daycare";
  const totalPhotoCount = keptPhotos.length + photos.length;
  const photoConsentWarning = findPhotoConsentWarning(
    audience,
    totalPhotoCount,
    options,
  );

  // Etiquetas y habitación fuera de las opciones: aparecen mientras sigan elegidas
  const selectedElderlyIds =
    audience.kind === "elderly" ? audience.elderlyIds : [];
  const extraElderly = edit?.extraElderly ?? [];
  const elderlyChips = [
    ...options.elderly,
    ...extraElderly.filter((elderly) =>
      selectedElderlyIds.includes(elderly.id),
    ),
  ];
  const extraRoom =
    edit?.extraRoom &&
    audience.kind === "room" &&
    audience.roomId === edit.extraRoom.id
      ? edit.extraRoom
      : null;
  const rooms = extraRoom ? [...options.rooms, extraRoom] : options.rooms;

  const removedPhotoIds = (edit?.photos ?? [])
    .filter((photo) => !keptPhotos.some((kept) => kept.id === photo.id))
    .map((photo) => photo.id);
  const canSave =
    !edit ||
    detectPostChanges(edit.input, {
      audience,
      fields,
      removedPhotoCount: removedPhotoIds.length,
      newPhotoCount: photos.length,
    });

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

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isPending || !canSave) return;
    const input: NewPostInput = {
      audience,
      ...fields,
      photoCount: totalPhotoCount,
    };
    const clientErrors = validateNewPost(input, {
      roomIds: rooms.map((room) => room.id),
      elderly: [...options.elderly, ...extraElderly],
      canPostToDaycare: options.canPostToDaycare,
    });

    if (Object.keys(clientErrors).length > 0) {
      showErrors(clientErrors);
      return;
    }
    setErrors({});
    onSubmit({ input, files: photos, removedPhotoIds }, showErrors);
  }

  function handleChange(event: FormEvent<HTMLFormElement>) {
    const { name } = event.target as HTMLInputElement;
    if (isNewPostField(name)) clearError(name);

    const formData = new FormData(event.currentTarget);
    // El título no está en el formulario con audiencia de adultos mayores: se conserva
    setFields((current) => ({
      type: String(formData.get("type") ?? current.type),
      title: String(formData.get("title") ?? current.title),
      body: String(formData.get("body") ?? current.body),
    }));
  }

  function addPhotos(incoming: File[]) {
    const { accepted, error } = selectPhotos(totalPhotoCount, incoming);
    setPhotos([...photos, ...accepted]);
    setPhotoError(error);
    clearError("photos");
  }

  function removeKeptPhoto(photoId: string) {
    setKeptPhotos(keptPhotos.filter((photo) => photo.id !== photoId));
    setPhotoError(null);
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
          {edit ? editPostMessages.dialogTitle : "Nueva publicación"}
        </h2>
        <button
          type="submit"
          disabled={isPending || !canSave}
          className="cursor-pointer text-[15px] font-extrabold text-coral-strong disabled:cursor-default disabled:opacity-50"
        >
          {edit
            ? isPending
              ? editPostMessages.savingLabel
              : editPostMessages.saveLabel
            : isPending
              ? "Publicando…"
              : "Publicar"}
        </button>
      </header>
      <fieldset
        disabled={isPending}
        className="m-0 flex min-h-0 min-w-0 flex-col gap-[22px] overflow-y-auto border-0 px-[26px] py-6"
      >
        <AudiencePicker
          labelId={audienceLabelId}
          error={errors.audience}
          elderly={elderlyChips}
          rooms={rooms}
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
        <PostTypePicker error={errors.type} defaultType={fields.type} />
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
              defaultValue={fields.title}
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
            defaultValue={fields.body}
            aria-invalid={errors.body ? true : undefined}
            aria-describedby={errors.body ? getFieldErrorId("body") : undefined}
            placeholder="Cuenta cómo le fue hoy…"
            className={`${fieldControlClassName} min-h-[120px] resize-y leading-normal`}
          />
          <FieldError fieldId="body" message={errors.body} />
        </div>
        <PhotoPicker
          keptPhotos={keptPhotos}
          photos={photos}
          error={errors.photos ?? photoError}
          warning={photoConsentWarning}
          onAdd={addPhotos}
          onRemove={removePhoto}
          onRemoveKept={removeKeptPhoto}
        />
      </fieldset>
    </form>
  );
}
