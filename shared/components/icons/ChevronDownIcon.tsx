import { Icon, type IconProps } from "./Icon";

export function ChevronDownIcon(props: IconProps) {
  return (
    <Icon strokeWidth={2.2} {...props}>
      <path d="m6 9 6 6 6-6" />
    </Icon>
  );
}
