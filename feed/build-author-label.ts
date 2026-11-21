import { userRoleLabels } from "@/users/user-role-labels";
import type { FeedPostData } from "./types";

// "Cuidador/a Diego"; "Equipo" si la RLS no deja leer al autor
export function buildAuthorLabel(
  post: Pick<FeedPostData, "authorRole" | "authorFirstName">,
): string {
  if (!post.authorRole || !post.authorFirstName) return "Equipo";
  return `${userRoleLabels[post.authorRole]} ${post.authorFirstName}`;
}
