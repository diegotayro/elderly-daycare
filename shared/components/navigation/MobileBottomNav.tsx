import { getVisibleNavItems, type NavVariant } from "./nav-items";
import { NavLink } from "./NavLink";

type MobileBottomNavProps = {
  variant: NavVariant;
  isAdmin?: boolean;
};

export function MobileBottomNav({
  variant,
  isAdmin = false,
}: MobileBottomNavProps) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 flex h-16 border-t border-line bg-surface lg:hidden">
      {getVisibleNavItems(variant, isAdmin).map(
        ({ key, label, href, activePath, exact, icon: Icon }) => (
          <NavLink
            key={key}
            href={href}
            activePath={activePath}
            exact={exact}
            baseClassName="flex flex-1 flex-col items-center justify-center gap-0.5 text-[11px]"
            activeClassName="font-extrabold text-coral-strong"
            inactiveClassName="font-semibold text-nav"
          >
            <Icon size={22} />
            {label}
          </NavLink>
        ),
      )}
    </nav>
  );
}
