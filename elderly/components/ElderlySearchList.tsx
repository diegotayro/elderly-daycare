"use client";

import { SearchIcon } from "@/shared/components/icons/SearchIcon";
import type { ElderlyListItem } from "../types";
import { ElderlyCard } from "./ElderlyCard";

type ElderlySearchListProps = {
  items: ElderlyListItem[];
};

export function ElderlySearchList({ items }: ElderlySearchListProps) {
  return (
    <>
      <label className="mb-[22px] flex items-center gap-[11px] rounded-[14px] border border-line bg-surface px-4 py-3 focus-within:border-coral">
        <SearchIcon size={18} className="flex-none text-[#B0A290]" />
        <input
          type="search"
          aria-label="Buscar adulto mayor"
          placeholder="Buscar adulto mayor…"
          className="min-w-0 flex-1 bg-transparent px-0.5 py-px text-[15px] text-ink outline-none placeholder:text-[#B6A99B]"
        />
      </label>
      <div className="mb-3.5 flex items-center gap-3">
        <span className="text-[12.5px] font-extrabold tracking-[0.8px] text-ink">
          ACTIVOS
        </span>
        <span className="text-[13px] text-muted">
          {items.length} adultos mayores
        </span>
        <span className="h-px flex-1 bg-divider" />
      </div>
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
        {items.map((item) => (
          <ElderlyCard key={item.id} item={item} />
        ))}
      </div>
    </>
  );
}
