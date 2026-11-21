export const photoViewerMessages = {
  openPhotoLabel: (position: number, total: number) =>
    `Ver foto ${position} de ${total} en pantalla completa`,
  viewerLabel: (position: number, total: number) =>
    `Foto ${position} de ${total}`,
  counter: (position: number, total: number) => `${position} / ${total}`,
  close: "Cerrar",
  download: "Descargar",
  previousPhoto: "Foto anterior",
  nextPhoto: "Foto siguiente",
  loadError: "No se pudo cargar la foto. Recarga la página para verla.",
  downloadErrorTitle: "No se pudo descargar la foto",
  downloadErrorDescription: "Revisa tu conexión e intenta de nuevo.",
} as const;
