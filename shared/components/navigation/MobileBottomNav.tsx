import Link from "next/link";
import { navItems, type NavKey } from "./nav-items";

type MobileBottomNavProps = {
  activeKey: NavKey;
};

export function MobileBottomNav({ activeKey }: MobileBottomNavProps) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 flex h-16 border-t border-line bg-surface lg:hidden">
      {navItems.map(({ key, label, href, icon: Icon }) => (
        <Link
          key={key}
          href={href}
          className={`flex flex-1 flex-col items-center justify-center gap-0.5 text-[11px] ${
            key === activeKey
              ? "font-extrabold text-coral-strong"
              : "font-semibold text-nav"
          }`}
        >
          <Icon size={22} />
          {label}
        </Link>
      ))}
    </nav>
  );
}
