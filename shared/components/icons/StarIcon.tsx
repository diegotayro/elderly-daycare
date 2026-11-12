import { Icon, type IconProps } from "./Icon";

export function StarIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m12 3 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 17l-5.2 2.1 1-5.8-4.3-4.1 5.9-.9z" />
    </Icon>
  );
}
