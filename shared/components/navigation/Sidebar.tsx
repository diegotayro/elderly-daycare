import Link from "next/link";
import { Avatar } from "../Avatar";
import { LogoutIcon } from "../icons/LogoutIcon";
import { PlusIcon } from "../icons/PlusIcon";
import { SunIcon } from "../icons/SunIcon";
import { navItems, type NavKey } from "./nav-items";

type SidebarProps = {
  daycareName: string;
  userName: string;
  userRoleLabel: string;
  activeKey: NavKey;
};

export function Sidebar({
  daycareName,
  userName,
  userRoleLabel,
  activeKey,
}: SidebarProps) {
  return (
    <aside className="sticky top-0 hidden h-screen w-62 flex-none flex-col border-r border-line bg-surface px-4 py-6 lg:flex">
      <Link href="/" className="flex items-center gap-[11px] px-2 pt-1 pb-[22px]">
        <div className="flex size-[38px] flex-none items-center justify-center rounded-xl bg-linear-155 from-[#F8C3A8] to-coral text-white">
          <SunIcon size={21} />
        </div>
        <div>
          <div className="font-display text-[17px] leading-none font-semibold text-ink">
            {daycareName}
          </div>
          <div className="mt-0.5 text-[11.5px] text-muted">Personal</div>
        </div>
      </Link>

      <Link
        href="/"
        className="mb-[18px] flex w-full items-center justify-center gap-2 rounded-[14px] bg-linear-to-b from-[#F4977E] to-[#EE8164] p-3 text-[14.5px] font-extrabold text-white shadow-[0_8px_18px_-8px_rgba(238,129,100,0.75)]"
      >
        <PlusIcon size={17} />
        Nueva publicación
      </Link>

      <nav className="flex flex-1 flex-col gap-1">
        {navItems.map(({ key, label, href, icon: Icon }) => (
          <Link
            key={key}
            href={href}
            className={
              key === activeKey
                ? "flex items-center gap-3 rounded-xl bg-coral-soft px-3 py-[11px] text-[14.5px] font-extrabold text-coral-strong"
                : "flex items-center gap-3 rounded-xl px-3 py-[11px] text-[14.5px] font-semibold text-nav"
            }
          >
            <Icon size={19} />
            {label}
          </Link>
        ))}
      </nav>

      <div className="mt-2.5 border-t border-line pt-3.5">
        <div className="flex items-center gap-[11px] px-2 py-1.5">
          <Avatar initial={userName[0]} />
          <div className="min-w-0 flex-1">
            <div className="text-sm font-extrabold text-ink">{userName}</div>
            <div className="text-xs text-muted">{userRoleLabel}</div>
          </div>
          <Link
            href="/"
            title="Cerrar sesión"
            className="flex size-8 flex-none items-center justify-center rounded-[10px] bg-cream text-muted-strong"
          >
            <LogoutIcon size={16} />
          </Link>
        </div>
      </div>
    </aside>
  );
}
