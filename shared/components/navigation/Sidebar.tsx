import { SignOutForm } from "@/auth/components/SignOutForm";
import { NewPostTrigger } from "@/feed/components/NewPostTrigger";
import { Avatar } from "../Avatar";
import { LogoutIcon } from "../icons/LogoutIcon";
import { PlusIcon } from "../icons/PlusIcon";
import { BrandLink } from "./BrandLink";
import { navItems } from "./nav-items";
import { NavLink } from "./NavLink";

type SidebarProps = {
  daycareName?: string;
  userName?: string;
  userRoleLabel?: string;
};

export function Sidebar({
  daycareName,
  userName,
  userRoleLabel,
}: SidebarProps) {
  return (
    <aside className="sticky top-0 hidden h-screen w-62 flex-none flex-col border-r border-line bg-surface px-4 py-6 lg:flex">
      <BrandLink daycareName={daycareName} className="px-2 pt-1 pb-[22px]" />

      <NewPostTrigger className="mb-[18px] flex w-full cursor-pointer items-center justify-center gap-2 rounded-[14px] bg-linear-to-b from-[#F4977E] to-[#EE8164] p-3 text-[14.5px] font-extrabold text-white shadow-[0_8px_18px_-8px_rgba(238,129,100,0.75)]">
        <PlusIcon size={17} />
        Nueva publicación
      </NewPostTrigger>

      <nav className="flex flex-1 flex-col gap-1">
        {navItems.map(({ key, label, href, activePath, icon: Icon }) => (
          <NavLink
            key={key}
            href={href}
            activePath={activePath}
            baseClassName="flex items-center gap-3 rounded-xl px-3 py-[11px] text-[14.5px]"
            activeClassName="bg-coral-soft font-extrabold text-coral-strong"
            inactiveClassName="font-semibold text-nav"
          >
            <Icon size={19} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="mt-2.5 border-t border-line pt-3.5">
        <div className="flex items-center gap-[11px] px-2 py-1.5">
          <Avatar initial={userName?.[0] ?? ""} />
          <div className="min-w-0 flex-1">
            <div className="text-sm font-extrabold text-ink">{userName}</div>
            <div className="text-xs text-muted">{userRoleLabel}</div>
          </div>
          <SignOutForm
            title="Cerrar sesión"
            className="flex size-8 flex-none cursor-pointer items-center justify-center rounded-[10px] bg-cream text-muted-strong"
          >
            <LogoutIcon size={16} />
          </SignOutForm>
        </div>
      </div>
    </aside>
  );
}
