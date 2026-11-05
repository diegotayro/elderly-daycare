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
  icon: ComponentType<IconProps>;
};

// Todos apuntan a "/" hasta que existan las pantallas respectivas.
export const navItems: NavItem[] = [
  { key: "feed", label: "Feed", href: "/", icon: HomeIcon },
  { key: "elderly", label: "Adultos mayores", href: "/", icon: PeopleIcon },
  { key: "notices", label: "Avisos", href: "/", icon: BellIcon },
  { key: "account", label: "Mi cuenta", href: "/", icon: UserIcon },
];
