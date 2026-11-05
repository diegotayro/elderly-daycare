import { Icon, type IconProps } from "./Icon";

export function ChevronLeftIcon(props: IconProps) {
  return (
    <Icon strokeWidth={2.2} {...props}>
      <path d="m15 18-6-6 6-6" />
    </Icon>
  );
}
