import "server-only";
import { cache } from "react";
import { getCurrentUser } from "@/auth/get-current-user";
import { signAvatarUrls } from "./sign-avatar-urls";

// React cache: el sidebar, el compositor y los comentarios firman la foto una sola vez
export const getCurrentUserPhotoUrl = cache(
  async (): Promise<string | null> => {
    const user = await getCurrentUser();
    if (!user) return null;

    const urls = await signAvatarUrls([user]);
    return urls[user.id] ?? null;
  },
);
