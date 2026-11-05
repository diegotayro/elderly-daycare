type AvatarProps = {
  initial: string;
  size?: number;
  fontSize?: number;
  colorClassName?: string;
  colors?: { bg: string; fg: string }; // colores libres; reemplaza a colorClassName
};

export function Avatar({
  initial,
  size = 38,
  fontSize = 16,
  colorClassName = "bg-coral text-white",
  colors,
}: AvatarProps) {
  return (
    <div
      className={`flex flex-none items-center justify-center rounded-full font-display font-semibold ${colors ? "" : colorClassName}`}
      style={{
        width: size,
        height: size,
        fontSize,
        ...(colors && { backgroundColor: colors.bg, color: colors.fg }),
      }}
    >
      {initial}
    </div>
  );
}
