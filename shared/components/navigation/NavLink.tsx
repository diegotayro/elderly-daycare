"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import type { NavItem } from "./nav-items";

type NavLinkProps = {
  href: string;
  activePath: NavItem["activePath"];
  baseClassName: string;
  activeClassName: string;
  inactiveClassName: string;
  children: ReactNode;
};

function isActivePath(pathname: string, activePath: NavItem["activePath"]) {
  if (activePath === null) return false;
  if (activePath === "/") return pathname === "/";
  return pathname === activePath || pathname.startsWith(`${activePath}/`);
}

function PathAwareLink({
  href,
  activePath,
  baseClassName,
  activeClassName,
  inactiveClassName,
  children,
}: NavLinkProps) {
  const pathname = usePathname();
  const stateClassName = isActivePath(pathname, activePath)
    ? activeClassName
    : inactiveClassName;

  return (
    <Link href={href} className={`${baseClassName} ${stateClassName}`}>
      {children}
    </Link>
  );
}

// usePathname puede suspender con cacheComponents; el fallback no marca activo.
export function NavLink(props: NavLinkProps) {
  const { href, baseClassName, inactiveClassName, children } = props;

  return (
    <Suspense
      fallback={
        <Link href={href} className={`${baseClassName} ${inactiveClassName}`}>
          {children}
        </Link>
      }
    >
      <PathAwareLink {...props} />
    </Suspense>
  );
}
