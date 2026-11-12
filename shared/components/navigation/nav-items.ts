import type { ComponentType } from "react";
import type { IconProps } from "../icons/Icon";
import { BellIcon } from "../icons/BellIcon";
import { HomeIcon } from "../icons/HomeIcon";
import { PeopleIcon } from "../icons/PeopleIcon";
import { SunIcon } from "../icons/SunIcon";
import { UserIcon } from "../icons/UserIcon";
import { avatarTones } from "@/elderly/avatar-tones";

export type NavVariant = "team" | "family";

export type NavItem = {
  key: string;
  label: string;
  href: string;
  activePath: string; // ruta que marca la opción como activa
  exact: boolean; // true: activo solo en la ruta exacta (inicio de cada área)
  icon: ComponentType<IconProps>;
};

export type NavVariantConfig = {
  items: NavItem[];
  brandSubtitle: "Personal" | "Familia";
  homeHref: "/" | "/family";
  showNewPost: boolean;
  userAvatarColors?: { bg: string; fg: string };
};

export const navVariants: Record<NavVariant, NavVariantConfig> = {
  team: {
    items: [
      {
        key: "feed",
        label: "Feed",
        href: "/",
        activePath: "/",
        exact: true,
        icon: HomeIcon,
      },
      {
        key: "elderly",
        label: "Adultos mayores",
        href: "/elderly",
        activePath: "/elderly",
        exact: false,
        icon: PeopleIcon,
      },
      {
        key: "notices",
        label: "Avisos",
        href: "/notices",
        activePath: "/notices",
        exact: false,
        icon: BellIcon,
      },
      {
        key: "account",
        label: "Mi cuenta",
        href: "/account",
        activePath: "/account",
        exact: false,
        icon: UserIcon,
      },
    ],
    brandSubtitle: "Personal",
    homeHref: "/",
    showNewPost: true,
  },
  family: {
    items: [
      {
        key: "feed",
        label: "Feed",
        href: "/family",
        activePath: "/family",
        exact: true,
        icon: HomeIcon,
      },
      {
        key: "summary",
        label: "Resumen del día",
        href: "/family/summary",
        activePath: "/family/summary",
        exact: false,
        icon: SunIcon,
      },
      {
        key: "account",
        label: "Mi cuenta",
        href: "/family/account",
        activePath: "/family/account",
        exact: false,
        icon: UserIcon,
      },
    ],
    brandSubtitle: "Familia",
    homeHref: "/family",
    showNewPost: false,
    userAvatarColors: avatarTones.lilac,
  },
};
