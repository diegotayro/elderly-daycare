type AvatarProps = {
  initial: string;
  size?: number;
  fontSize?: number;
  colorClassName?: string;
};

export function Avatar({
  initial,
  size = 38,
  fontSize = 16,
  colorClassName = "bg-coral text-white",
}: AvatarProps) {
  return (
    <div
      className={`flex flex-none items-center justify-center rounded-full font-display font-semibold ${colorClassName}`}
      style={{ width: size, height: size, fontSize }}
    >
      {initial}
    </div>
  );
}
