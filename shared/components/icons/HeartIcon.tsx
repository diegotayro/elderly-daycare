import { Icon, type IconProps } from "./Icon";

type HeartIconProps = IconProps & { filled?: boolean };

export function HeartIcon({ filled = true, ...props }: HeartIconProps) {
  return (
    <Icon fill={filled ? "currentColor" : "none"} {...props}>
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21.2l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.8z" />
    </Icon>
  );
}
