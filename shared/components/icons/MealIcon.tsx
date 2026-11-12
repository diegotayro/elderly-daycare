import { Icon, type IconProps } from "./Icon";

export function MealIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3 11h18a8 8 0 0 1-16 0M12 3v3" />
    </Icon>
  );
}
