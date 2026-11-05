import { Icon, type IconProps } from "./Icon";

export function ChevronRightIcon(props: IconProps) {
  return (
    <Icon strokeWidth={2.2} {...props}>
      <path d="m9 18 6-6-6-6" />
    </Icon>
  );
}
