const listFormatter = new Intl.ListFormat("es", { type: "conjunction" });

export const newPostMessages = {
  audienceRequired: "Elige para quién es la publicación.",
  typeRequired: "Elige un tipo.",
  titleTooLong: "El título puede tener hasta 120 caracteres.",
  bodyRequired: "Escribe una descripción.",
  bodyTooLong: "La descripción puede tener hasta 2000 caracteres.",
  tooManyPhotos: "Puedes agregar hasta 5 fotos.",
  photoNotImage: "Solo puedes agregar imágenes.",
  photoTooLarge: "Cada foto puede pesar hasta 20 MB.",
  photoConsentMissing: (names: string[]) =>
    names.length === 1
      ? `${names[0]} no tiene consentimiento de fotos. Quita las fotos o quita a ${names[0]}.`
      : `${listFormatter.format(names)} no tienen consentimiento de fotos. Quita las fotos o quítalos de la publicación.`,
  photoProcessingFailed: (photoNumber: number) =>
    `No pudimos procesar la foto ${photoNumber}. Prueba con otra imagen.`,
  photoConsentWarningRoom: (roomName: string) =>
    `En ${roomName} hay adultos mayores sin consentimiento de fotos. Revisa que no aparezcan.`,
  photoConsentWarningDaycare:
    "En la guardería hay adultos mayores sin consentimiento de fotos. Revisa que no aparezcan.",
  photoConsentLegend: "Sin consentimiento de fotos",
  publishSuccessTitle: "Publicación creada",
  publishSuccessDescription: "Ya está en el feed.",
  publishErrorTitle: "No pudimos publicar",
  publishErrorDescription: "Inténtalo de nuevo.",
  loadMoreErrorTitle: "No pudimos cargar más publicaciones",
  loadMoreErrorDescription: "Inténtalo de nuevo.",
} as const;
