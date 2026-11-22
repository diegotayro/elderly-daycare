export type AvatarPhoto = {
  url: string; // url firmada
  width: number | null;
  height: number | null;
};

// Lo que puede hacer quien mira el avatar
export type AvatarPermissions = { canChange: boolean; canRemove: boolean };

export type AvatarActionResult = { status: "ok" } | { status: "error" };

// "unprocessable": la imagen no se pudo leer o comprimir; "error": falló la subida o el guardado
export type AvatarUploadResult =
  | { status: "ok" }
  | { status: "unprocessable" }
  | { status: "error" };
