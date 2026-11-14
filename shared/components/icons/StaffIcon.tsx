import { Icon, type IconProps } from "./Icon";

export function StaffIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="7.5" r="3.5" />
      <path d="M5 21v-1a7 7 0 0 1 14 0v1" />
      <path d="M12 14.5v3" />
    </Icon>
  );
}
