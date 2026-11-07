import type { ComponentType } from "react";
import type { IconProps } from "../icons/Icon";
import { BellIcon } from "../icons/BellIcon";
import { HomeIcon } from "../icons/HomeIcon";
import { PeopleIcon } from "../icons/PeopleIcon";
import { UserIcon } from "../icons/UserIcon";

export type NavKey = "feed" | "elderly" | "notices" | "account";

export type NavItem = {
  key: NavKey;
  label: string;
  href: string;
  activePath: "/" | "/elderly" | "/notices" | "/account"; // ruta que marca la opción como activa
  icon: ComponentType<IconProps>;
};

export const navItems: NavItem[] = [
  { key: "feed", label: "Feed", href: "/", activePath: "/", icon: HomeIcon },
  { key: "elderly", label: "Adultos mayores", href: "/elderly", activePath: "/elderly", icon: PeopleIcon },
  { key: "notices", label: "Avisos", href: "/notices", activePath: "/notices", icon: BellIcon },
  { key: "account", label: "Mi cuenta", href: "/account", activePath: "/account", icon: UserIcon },
];
