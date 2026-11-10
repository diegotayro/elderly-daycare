type SkeletonBlockProps = {
  className?: string;
};

export function SkeletonBlock({ className = "" }: SkeletonBlockProps) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse bg-line motion-reduce:animate-none ${className}`}
    />
  );
}
