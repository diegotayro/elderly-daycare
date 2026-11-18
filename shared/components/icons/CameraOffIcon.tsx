import { Icon, type IconProps } from "./Icon";

export function CameraOffIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M1 1l22 22" />
      <path d="M21 21H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3m3-3h6l2 3h4a2 2 0 0 1 2 2v9.34m-7.72-2.06a4 4 0 1 1-5.56-5.56" />
    </Icon>
  );
}
