"use server";

import { cookies } from "next/headers";
import { getCurrentUser } from "@/auth/get-current-user";
import { createClient } from "@/shared/supabase/server";
import { isUuid } from "@/shared/text/is-uuid";
import { REACTION_TYPE } from "../reaction-type";
import type { SetReactionResult } from "../types";

const UNIQUE_VIOLATION = "23505";

// Estado deseado e idempotente: repetir la llamada no produce errores ni filas duplicadas
export async function setReaction(
  postId: string,
  reacted: boolean,
): Promise<SetReactionResult> {
  const isValidInput =
    typeof postId === "string" && isUuid(postId) && typeof reacted === "boolean";
  if (!isValidInput) return { status: "error" };

  const user = await getCurrentUser();
  if (!user) return { status: "error" };

  const supabase = createClient(await cookies());
  const { error } = reacted
    ? await supabase
        .from("reactions")
        .insert({ post_id: postId, user_id: user.id, type: REACTION_TYPE })
    : await supabase
        .from("reactions")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", user.id);

  if (error && error.code !== UNIQUE_VIOLATION) {
    console.error("setReaction: no se pudo guardar la reacción", error);
    return { status: "error" };
  }
  return { status: "ok" };
}
