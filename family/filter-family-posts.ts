import type { ElderlyFilter, FamilyFeedElderly, FamilyPost } from "./types";

// Con un adulto mayor elegido: los posts que lo etiquetan, los de su habitación y los de la guardería
export function filterFamilyPosts(
  posts: FamilyPost[],
  filter: ElderlyFilter,
  elderly: FamilyFeedElderly[],
): FamilyPost[] {
  if (filter.kind === "all") return posts;

  const selected = elderly.find(({ id }) => id === filter.elderlyId);

  return posts.filter(
    (post) =>
      post.elderlyIds.includes(filter.elderlyId) ||
      (post.audience === "room" && post.roomId === selected?.roomId) ||
      post.audience === "daycare",
  );
}
