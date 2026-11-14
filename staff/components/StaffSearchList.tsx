"use client";

import { useState } from "react";
import { SearchIcon } from "@/shared/components/icons/SearchIcon";
import { normalizeSearch } from "@/shared/text/normalize-search";
import type { StaffList, StaffListItem } from "../types";
import { StaffCard } from "./StaffCard";

type StaffSearchListProps = {
  list: StaffList;
};

function formatCount(count: number): string {
  return count === 1 ? "1 persona" : `${count} personas`;
}

type StaffSectionProps = {
  label: string;
  items: StaffListItem[];
};

function StaffSection({ label, items }: StaffSectionProps) {
  if (items.length === 0) return null;

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
          <StaffCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}

export function StaffSearchList({ list }: StaffSearchListProps) {
  const [query, setQuery] = useState("");
  const normalizedQuery = normalizeSearch(query.trim());
  const matchesQuery = (item: StaffListItem) =>
    normalizeSearch(item.fullName).includes(normalizedQuery);
  const visible = {
    active: list.active.filter(matchesQuery),
    pending: list.pending.filter(matchesQuery),
    archived: list.archived.filter(matchesQuery),
  };
  const hasAnyItem =
    list.active.length + list.pending.length + list.archived.length > 0;
  const hasAnyMatch =
    visible.active.length + visible.pending.length + visible.archived.length >
    0;

  return (
    <>
      <label className="mb-[22px] flex items-center gap-[11px] rounded-[14px] border border-line bg-surface px-4 py-3 focus-within:border-coral">
        <SearchIcon size={18} className="flex-none text-[#B0A290]" />
        <input
          type="search"
          aria-label="Buscar staff"
          placeholder="Buscar staff…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="min-w-0 flex-1 bg-transparent px-0.5 py-px text-[15px] text-ink outline-none placeholder:text-[#B6A99B]"
        />
      </label>
      {!hasAnyItem && (
        <p className="py-8 text-center text-[15px] text-muted-strong">
          Todavía no hay personal en el equipo.
        </p>
      )}
      {hasAnyItem && !hasAnyMatch && (
        <p className="py-8 text-center text-[15px] text-muted-strong">
          No encontramos a nadie del staff con ese nombre.
        </p>
      )}
      {hasAnyMatch && (
        <div className="flex flex-col gap-7">
          <StaffSection label="ACTIVOS" items={visible.active} />
          <StaffSection label="PENDIENTES" items={visible.pending} />
          <StaffSection label="ARCHIVADOS" items={visible.archived} />
        </div>
      )}
    </>
  );
}
