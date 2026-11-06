import { Icon, type IconProps } from "./Icon";

export function CloseIcon(props: IconProps) {
  return (
    <Icon strokeWidth={2.2} {...props}>
      <path d="M18 6 6 18M6 6l12 12" />
    </Icon>
  );
}
