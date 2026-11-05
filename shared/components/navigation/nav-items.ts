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
  activePath: "/" | "/elderly" | null; // ruta que marca la opción como activa
  icon: ComponentType<IconProps>;
};

// "Avisos" y "Mi cuenta" apuntan a "/" hasta que existan, sin marcarse activos.
export const navItems: NavItem[] = [
  { key: "feed", label: "Feed", href: "/", activePath: "/", icon: HomeIcon },
  { key: "elderly", label: "Adultos mayores", href: "/elderly", activePath: "/elderly", icon: PeopleIcon },
  { key: "notices", label: "Avisos", href: "/", activePath: null, icon: BellIcon },
  { key: "account", label: "Mi cuenta", href: "/", activePath: null, icon: UserIcon },
];
