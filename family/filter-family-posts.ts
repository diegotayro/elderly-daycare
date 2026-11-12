import type { ElderlyFilter, FamilyPost } from "./types";

// Los anuncios generales (sin adultos mayores) se ven con cualquier filtro
export function filterFamilyPosts(
  posts: FamilyPost[],
  filter: ElderlyFilter,
): FamilyPost[] {
  if (filter.kind === "all") return posts;

  return posts.filter(
    ({ elderlyIds }) =>
      elderlyIds.length === 0 || elderlyIds.includes(filter.elderlyId),
  );
}
