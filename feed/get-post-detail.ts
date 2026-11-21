import "server-only";
import type { CurrentUser } from "@/auth/types";
import { toCommentView } from "@/comments/build-comment-view";
import { fetchComments } from "@/comments/fetch-comments";
import type { CommentView } from "@/comments/types";
import { toFamilyPost } from "@/family/build-family-feed";
import type { FamilyFeedElderly, FamilyPost } from "@/family/types";
import { formatRelativeTime } from "@/shared/date/format-relative-time";
import { getLimaToday } from "@/shared/date/get-lima-today";
import { isUuid } from "@/shared/text/is-uuid";
import { toFeedPost } from "./build-feed";
import { fetchPost } from "./fetch-post";
import type { FeedPost, FeedPostData, PostDetail } from "./types";

type LoadedDetail = {
  postData: FeedPostData;
  comments: CommentView[];
  today: string;
};

// null si el id no es válido o si el post no existe o no es visible para el usuario
async function loadDetail(
  postId: string,
  user: CurrentUser,
): Promise<LoadedDetail | null> {
  if (!isUuid(postId)) return null;

  const today = getLimaToday();
  const [postData, commentRows] = await Promise.all([
    fetchPost(postId, user.id),
    fetchComments(postId),
  ]);
  if (!postData) return null;

  return {
    postData,
    comments: commentRows.map((row) => toCommentView(row, user, today)),
    today,
  };
}

export async function getTeamPostDetail(
  postId: string,
  user: CurrentUser,
): Promise<PostDetail<FeedPost> | null> {
  const detail = await loadDetail(postId, user);
  if (!detail) return null;

  const post = toFeedPost(detail.postData, user.id);
  return {
    post: {
      ...post,
      time: formatRelativeTime(detail.postData.publishedAt, detail.today),
    },
    comments: detail.comments,
  };
}

export async function getFamilyPostDetail(
  postId: string,
  user: CurrentUser,
  elderly: FamilyFeedElderly[],
): Promise<PostDetail<FamilyPost> | null> {
  const detail = await loadDetail(postId, user);
  if (!detail) return null;

  const post = toFamilyPost(detail.postData, { today: detail.today, elderly });
  return {
    post: {
      ...post,
      time: formatRelativeTime(detail.postData.publishedAt, detail.today),
    },
    comments: detail.comments,
  };
}
