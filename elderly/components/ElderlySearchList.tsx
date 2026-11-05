"use client";

import { useState } from "react";
import { SearchIcon } from "@/shared/components/icons/SearchIcon";
import { normalizeSearch } from "@/shared/text/normalize-search";
import type { ElderlyListItem } from "../types";
import { ElderlyCard } from "./ElderlyCard";

type ElderlySearchListProps = {
  items: ElderlyListItem[];
};

function formatCount(count: number): string {
  return count === 1 ? "1 adulto mayor" : `${count} adultos mayores`;
}

export function ElderlySearchList({ items }: ElderlySearchListProps) {
  const [query, setQuery] = useState("");
  const normalizedQuery = normalizeSearch(query.trim());
  const visibleItems = items.filter((item) =>
    normalizeSearch(item.fullName).includes(normalizedQuery),
  );

  return (
    <>
      <label className="mb-[22px] flex items-center gap-[11px] rounded-[14px] border border-line bg-surface px-4 py-3 focus-within:border-coral">
        <SearchIcon size={18} className="flex-none text-[#B0A290]" />
        <input
          type="search"
          aria-label="Buscar adulto mayor"
          placeholder="Buscar adulto mayor…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="min-w-0 flex-1 bg-transparent px-0.5 py-px text-[15px] text-ink outline-none placeholder:text-[#B6A99B]"
        />
      </label>
      <div className="mb-3.5 flex items-center gap-3">
        <span className="text-[12.5px] font-extrabold tracking-[0.8px] text-ink">
          ACTIVOS
        </span>
        <span className="text-[13px] text-muted">
          {formatCount(visibleItems.length)}
        </span>
        <span className="h-px flex-1 bg-divider" />
      </div>
      {visibleItems.length === 0 ? (
        <p className="py-8 text-center text-[15px] text-muted-strong">
          No encontramos adultos mayores con “{query.trim()}”.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          {visibleItems.map((item) => (
            <ElderlyCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </>
  );
}
