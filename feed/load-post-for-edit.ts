import "server-only";
import { cookies } from "next/headers";
import type { CurrentUser } from "@/auth/types";
import type { PostAudience, PostType } from "@/shared/database/types";
import { createClient } from "@/shared/supabase/server";
import { isUuid } from "@/shared/text/is-uuid";
import { toAudienceElderlyOption } from "./build-new-post-options";
import { signPhotoUrls } from "./fetch-feed-page";
import { getNewPostOptions } from "./get-new-post-options";
import type {
  AudienceSelection,
  EditablePhoto,
  NewPostOptions,
  PostForEdit,
} from "./types";

const EDIT_COLUMNS = `
  id, author_id, audience, room_id, type, title, body,
  room:rooms(id, name),
  post_elderly(elderly_id, elderly(id, first_name, photo_consent)),
  post_photos(id, url, width, height, position)
`;

type EditRow = {
  id: string;
  author_id: string;
  audience: PostAudience;
  room_id: string | null;
  type: PostType;
  title: string | null;
  body: string;
  room: { id: string; name: string } | null;
  // elderly es null cuando la RLS no deja leer al adulto mayor etiquetado
  post_elderly: {
    elderly_id: string;
    elderly: { id: string; first_name: string; photo_consent: boolean } | null;
  }[];
  post_photos: {
    id: string;
    url: string;
    width: number | null;
    height: number | null;
    position: number;
  }[];
};

export type StoredPhoto = { id: string; path: string; position: number };

export type LoadedPostForEdit =
  | {
      status: "ok";
      post: PostForEdit;
      options: NewPostOptions;
      readableElderlyIds: string[]; // etiquetas que el usuario puede leer
      storedPhotos: StoredPhoto[];
    }
  | { status: "has-history" }
  | { status: "error" };

type ServerClient = ReturnType<typeof createClient>;

function toAudienceSelection(
  row: EditRow,
  elderlyIds: string[],
): AudienceSelection {
  switch (row.audience) {
    case "elderly":
      return { kind: "elderly", elderlyIds };
    case "room":
      return { kind: "room", roomId: row.room_id ?? "" };
    case "daycare":
      return { kind: "daycare" };
  }
}

export async function hasHistory(
  supabase: ServerClient,
  postId: string,
): Promise<boolean> {
  const { data, error } = await supabase.rpc("post_has_history", {
    p_post_id: postId,
  });
  if (error) throw error;
  return data === true;
}

async function toEditablePhotos(
  supabase: ServerClient,
  row: EditRow,
): Promise<EditablePhoto[]> {
  const urlsByPath = await signPhotoUrls(
    supabase,
    row.post_photos.map((photo) => photo.url),
  );
  return [...row.post_photos]
    .sort((a, b) => a.position - b.position)
    .flatMap((photo) => {
      const url = urlsByPath.get(photo.url);
      return url
        ? [
            {
              id: photo.id,
              url,
              width: photo.width,
              height: photo.height,
              position: photo.position,
            },
          ]
        : [];
    });
}

// Carga lo que necesita el formulario de edición y comprueba que el usuario pueda editar.
// Admin: cualquier post visible. Staff: solo los suyos sin historial.
export async function loadPostForEdit(
  postId: string,
  user: CurrentUser,
): Promise<LoadedPostForEdit> {
  if (
    user.role === "relative" ||
    typeof postId !== "string" ||
    !isUuid(postId)
  ) {
    return { status: "error" };
  }

  const supabase = createClient(await cookies());
  const { data: row, error } = await supabase
    .from("posts")
    .select(EDIT_COLUMNS)
    .eq("id", postId)
    .maybeSingle<EditRow>();
  if (error) throw error;
  if (!row) return { status: "error" };

  if (user.role === "staff") {
    if (row.author_id !== user.id) return { status: "error" };
    if (await hasHistory(supabase, postId)) return { status: "has-history" };
  }

  const [options, photos] = await Promise.all([
    getNewPostOptions(),
    toEditablePhotos(supabase, row),
  ]);

  const readableTags = row.post_elderly.flatMap(({ elderly }) =>
    elderly ? [elderly] : [],
  );
  const optionElderlyIds = new Set(options.elderly.map((option) => option.id));
  const readableElderlyIds = readableTags.map((elderly) => elderly.id);
  const extraRoom =
    row.room && !options.rooms.some((room) => room.id === row.room?.id)
      ? row.room
      : null;

  return {
    status: "ok",
    options,
    readableElderlyIds,
    storedPhotos: row.post_photos.map((photo) => ({
      id: photo.id,
      path: photo.url,
      position: photo.position,
    })),
    post: {
      id: row.id,
      input: {
        audience: toAudienceSelection(row, readableElderlyIds),
        type: row.type,
        title: row.title ?? "",
        body: row.body,
        photoCount: photos.length,
      },
      photos,
      nextPhotoPosition:
        Math.max(-1, ...row.post_photos.map((photo) => photo.position)) + 1,
      extraElderly: readableTags
        .filter((elderly) => !optionElderlyIds.has(elderly.id))
        .map(toAudienceElderlyOption),
      extraRoom,
    },
  };
}
