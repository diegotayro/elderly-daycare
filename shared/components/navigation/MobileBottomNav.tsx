import { navItems } from "./nav-items";
import { NavLink } from "./NavLink";

export function MobileBottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 flex h-16 border-t border-line bg-surface lg:hidden">
      {navItems.map(({ key, label, href, activePath, icon: Icon }) => (
        <NavLink
          key={key}
          href={href}
          activePath={activePath}
          baseClassName="flex flex-1 flex-col items-center justify-center gap-0.5 text-[11px]"
          activeClassName="font-extrabold text-coral-strong"
          inactiveClassName="font-semibold text-nav"
        >
          <Icon size={22} />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
