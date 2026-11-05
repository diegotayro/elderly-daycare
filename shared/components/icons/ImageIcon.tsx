import { Icon, type IconProps } from "./Icon";

export function ImageIcon(props: IconProps) {
  return (
    <Icon strokeWidth={1.7} {...props}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-3.6-3.6a2 2 0 0 0-2.8 0L6 21" />
    </Icon>
  );
}
