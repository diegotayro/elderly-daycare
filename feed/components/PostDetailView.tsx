import Link from "next/link";
import type { ReactNode } from "react";
import type { CurrentUser } from "@/auth/types";
import { CommentInputProvider } from "@/comments/components/CommentInputProvider";
import { CommentList } from "@/comments/components/CommentList";
import type { CommentView } from "@/comments/types";
import { getAvatarTone } from "@/elderly/get-avatar-tone";
import { ChevronLeftIcon } from "@/shared/components/icons/ChevronLeftIcon";
import type { FeedPhoto, PhotoViewerPost } from "../types";
import { PhotoCarousel } from "./PhotoCarousel";
import { PostDetailReactions } from "./PostDetailReactions";

const PHOTO_SIZE_CLASS_NAME = "mt-4 h-[220px] lg:h-[280px]";

type PostDetailViewProps = {
  post: {
    id: string;
    body: string;
    photos: FeedPhoto[];
    reactionCount: number;
    reactedByMe: boolean;
  };
  viewerPost: PhotoViewerPost;
  comments: CommentView[];
  currentUser: Pick<CurrentUser, "id" | "first_name">;
  backHref: string; // "/" o "/family"
  children: ReactNode; // cabecera de la tarjeta, según el rol
};

export function PostDetailView({
  post,
  viewerPost,
  comments,
  currentUser,
  backHref,
  children,
}: PostDetailViewProps) {
  const author = {
    initial: currentUser.first_name.charAt(0).toUpperCase(),
    tone: getAvatarTone(currentUser.id),
  };

  return (
    <CommentInputProvider>
      <div className="mx-auto w-full max-w-[680px] px-4 pt-5 pb-8 lg:px-10 lg:pt-[34px] lg:pb-10">
        <Link
          href={backHref}
          className="mb-[18px] flex min-h-11 items-center gap-[7px] text-sm font-bold text-muted-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral-strong"
        >
          <ChevronLeftIcon size={18} />
          Volver al feed
        </Link>

        <article className="rounded-[22px] border border-line bg-surface px-[18px] py-5 shadow-[0_6px_22px_-14px_rgba(120,90,60,0.5)] lg:px-[26px] lg:py-6">
          {children}
          <p className="m-0 mb-1 text-base leading-[1.6] break-words text-body">
            {post.body}
          </p>
          {post.photos.length > 0 && (
            <PhotoCarousel
              photos={post.photos}
              viewerPost={viewerPost}
              sizeClassName={PHOTO_SIZE_CLASS_NAME}
            />
          )}
          <PostDetailReactions
            postId={post.id}
            initialReacted={post.reactedByMe}
            initialCount={post.reactionCount}
          />
        </article>

        <CommentList
          postId={post.id}
          initialComments={comments}
          author={author}
        />
      </div>
    </CommentInputProvider>
  );
}
