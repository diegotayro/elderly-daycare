"use server";

import { refresh } from "next/cache";
import { cookies } from "next/headers";
import { getCurrentUser } from "@/auth/get-current-user";
import { createClient } from "@/shared/supabase/server";
import type { PostType } from "@/shared/database/types";
import { MAX_PHOTOS } from "../new-post-limits";
import {
  hasHistory,
  loadPostForEdit,
  type LoadedPostForEdit,
} from "../load-post-for-edit";
import { parseEditPostInput } from "../parse-edit-post-input";
import type { EditPostInput, UpdatePostResult } from "../types";
import { validateNewPost } from "../validate-new-post";

type LoadedPost = Extract<LoadedPostForEdit, { status: "ok" }>;

// Las fotos quitadas deben ser del post y las nuevas deben usar posiciones libres
function hasValidPhotoChanges(input: EditPostInput, loaded: LoadedPost) {
  const storedIds = new Set(loaded.storedPhotos.map((photo) => photo.id));
  const lastPosition = loaded.post.nextPhotoPosition - 1;
  const newPositions = input.newPhotos.map((photo) => photo.position);

  return (
    input.removedPhotoIds.every((id) => storedIds.has(id)) &&
    new Set(input.removedPhotoIds).size === input.removedPhotoIds.length &&
    new Set(newPositions).size === newPositions.length &&
    newPositions.every((position) => position > lastPosition) &&
    finalPhotoCount(input, loaded) <= MAX_PHOTOS
  );
}

function finalPhotoCount(input: EditPostInput, loaded: LoadedPost): number {
  return (
    loaded.storedPhotos.length -
    input.removedPhotoIds.length +
    input.newPhotos.length
  );
}

function diffElderlyIds(input: EditPostInput, readableIds: string[]) {
  if (input.audience.kind !== "elderly") return { add: [], remove: [] };
  const selected = input.audience.elderlyIds;
  return {
    add: selected.filter((id) => !readableIds.includes(id)),
    remove: readableIds.filter((id) => !selected.includes(id)),
  };
}

export async function updatePost(
  postId: string,
  rawInput: unknown,
): Promise<UpdatePostResult> {
  const user = await getCurrentUser();
  if (!user || user.role === "relative") return { status: "error" };

  const parsed = parseEditPostInput(postId, rawInput);
  if (!parsed) return { status: "error" };

  const loaded = await loadPostForEdit(postId, user).catch((error) => {
    console.error("updatePost: no se pudo cargar la publicación", error);
    return { status: "error" } as const;
  });
  if (loaded.status !== "ok") return { status: loaded.status };
  if (!hasValidPhotoChanges(parsed, loaded)) return { status: "error" };

  // photoCount lo calcula el servidor con el estado final; el del cliente no cuenta
  const input = { ...parsed, photoCount: finalPhotoCount(parsed, loaded) };
  const { options, post } = loaded;
  const roomIds = options.rooms.map((room) => room.id);
  if (post.extraRoom) roomIds.push(post.extraRoom.id);
  const errors = validateNewPost(input, {
    roomIds,
    elderly: [...options.elderly, ...post.extraElderly],
    canPostToDaycare: options.canPostToDaycare,
  });
  if (Object.keys(errors).length > 0) return { status: "invalid", errors };

  const audience = input.audience;
  if (audience.kind === "none") return { status: "error" };
  const { add, remove } = diffElderlyIds(input, loaded.readableElderlyIds);
  // Solo room y daycare llevan título; vacío se guarda como null
  const title = audience.kind === "elderly" ? "" : input.title.trim();

  const supabase = createClient(await cookies());
  const { error } = await supabase.rpc("update_post", {
    p_post_id: postId,
    p_audience: audience.kind,
    p_room_id: audience.kind === "room" ? audience.roomId : null,
    p_type: input.type as PostType,
    p_title: title || null,
    p_body: input.body.trim(),
    p_add_elderly_ids: add,
    p_remove_elderly_ids: remove,
    p_new_photos: input.newPhotos.map(({ path, width, height, position }) => ({
      url: path,
      width,
      height,
      position,
    })),
    p_removed_photo_ids: input.removedPhotoIds,
  });
  if (error) {
    console.error("updatePost: no se pudo guardar la publicación", error);
    // El staff pudo perder el permiso mientras editaba: alguien reaccionó o comentó
    const lostPermission =
      user.role === "staff" && (await hasHistory(supabase, postId));
    return { status: lostPermission ? "has-history" : "error" };
  }

  await removeStoredFiles(supabase, loaded, input.removedPhotoIds);
  refresh();
  return { status: "ok" };
}

// La DB ya quedó coherente: si el borrado falla, el archivo queda huérfano (se borra con el post)
async function removeStoredFiles(
  supabase: ReturnType<typeof createClient>,
  loaded: LoadedPost,
  removedPhotoIds: string[],
) {
  const paths = loaded.storedPhotos
    .filter((photo) => removedPhotoIds.includes(photo.id))
    .map((photo) => photo.path);
  if (paths.length === 0) return;

  const { error } = await supabase.storage.from("post-photos").remove(paths);
  if (error) {
    console.error("updatePost: no se pudieron borrar los archivos", error);
  }
}
