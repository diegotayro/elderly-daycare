"use server";

import { refresh } from "next/cache";
import { cookies } from "next/headers";
import { getCurrentUser } from "@/auth/get-current-user";
import { createClient } from "@/shared/supabase/server";
import { getNewPostOptions } from "../get-new-post-options";
import { parseNewPostInput } from "../parse-new-post-input";
import type { AudienceSelection, CreatePostResult } from "../types";
import { validateNewPost } from "../validate-new-post";

type PostTarget = {
  audience: "elderly" | "room" | "daycare";
  roomId: string | null;
  elderlyIds: string[];
};

// La audiencia ya está validada: "none" no llega hasta aquí
function toPostTarget(audience: AudienceSelection): PostTarget | null {
  switch (audience.kind) {
    case "elderly":
      return {
        audience: "elderly",
        roomId: null,
        elderlyIds: audience.elderlyIds,
      };
    case "room":
      return { audience: "room", roomId: audience.roomId, elderlyIds: [] };
    case "daycare":
      return { audience: "daycare", roomId: null, elderlyIds: [] };
    case "none":
      return null;
  }
}

export async function createPost(rawInput: unknown): Promise<CreatePostResult> {
  const user = await getCurrentUser();
  if (!user || user.role === "relative") return { status: "error" };

  const input = parseNewPostInput(rawInput);
  if (!input) return { status: "error" };

  const options = await getNewPostOptions();
  const errors = validateNewPost(input, {
    roomIds: options.rooms.map((room) => room.id),
    elderly: options.elderly,
    canPostToDaycare: options.canPostToDaycare,
  });
  if (Object.keys(errors).length > 0) return { status: "invalid", errors };

  const target = toPostTarget(input.audience);
  if (!target) return { status: "error" };

  // Título opcional en cualquier audiencia; vacío se guarda como null
  const title = input.title.trim();

  const supabase = createClient(await cookies());
  const { data: postId, error } = await supabase.rpc("create_post", {
    p_audience: target.audience,
    p_room_id: target.roomId,
    p_type: input.type,
    p_title: title || null,
    p_body: input.body.trim(),
    p_elderly_ids: target.elderlyIds,
  });
  if (error || !postId) {
    console.error("createPost: no se pudo crear la publicación", error);
    return { status: "error" };
  }

  if (input.photoCount === 0) refresh();
  return { status: "ok", postId };
}
