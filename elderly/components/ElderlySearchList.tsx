"use client";

import { useState } from "react";
import { SearchIcon } from "@/shared/components/icons/SearchIcon";
import { normalizeSearch } from "@/shared/text/normalize-search";
import type { ElderlyList, ElderlyListItem } from "../types";
import { ElderlyCard } from "./ElderlyCard";

type ElderlySearchListProps = {
  list: ElderlyList;
};

function formatCount(count: number): string {
  return count === 1 ? "1 adulto mayor" : `${count} adultos mayores`;
}

type ElderlySectionProps = {
  label: string;
  items: ElderlyListItem[];
};

function ElderlySection({ label, items }: ElderlySectionProps) {
  return (
    <section aria-label={label}>
      <div className="mb-3.5 flex items-center gap-3">
        <span className="text-[12.5px] font-extrabold tracking-[0.8px] text-ink">
          {label}
        </span>
        <span className="text-[13px] text-muted">
          {formatCount(items.length)}
        </span>
        <span className="h-px flex-1 bg-divider" />
      </div>
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
        {items.map((item) => (
          <ElderlyCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}

export function ElderlySearchList({ list }: ElderlySearchListProps) {
  const [query, setQuery] = useState("");
  const normalizedQuery = normalizeSearch(query.trim());
  const matchesQuery = (item: ElderlyListItem) =>
    normalizeSearch(item.fullName).includes(normalizedQuery);
  const visibleActive = list.active.filter(matchesQuery);
  const visibleArchived = list.archived.filter(matchesQuery);
  const hasAnyItem = list.active.length + list.archived.length > 0;
  const hasAnyMatch = visibleActive.length + visibleArchived.length > 0;

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
      {!hasAnyItem && (
        <p className="py-8 text-center text-[15px] text-muted-strong">
          Todavía no hay adultos mayores.
        </p>
      )}
      {hasAnyItem && !hasAnyMatch && (
        <p className="py-8 text-center text-[15px] text-muted-strong">
          No encontramos adultos mayores con “{query.trim()}”.
        </p>
      )}
      {hasAnyItem && (
        <div className="flex flex-col gap-7">
          <ElderlySection label="ACTIVOS" items={visibleActive} />
          {visibleArchived.length > 0 && (
            <ElderlySection label="ARCHIVADOS" items={visibleArchived} />
          )}
        </div>
      )}
    </>
  );
}
