"use client";

import { useId, useState, type ReactNode } from "react";
import { SearchIcon } from "@/shared/components/icons/SearchIcon";
import { normalizeSearch } from "@/shared/text/normalize-search";
import { buildNewStaffItem } from "../build-new-staff-item";
import type { NewStaffInput, StaffList, StaffListItem } from "../types";
import type { AvatarTone } from "@/elderly/avatar-tones";
import { AddStaffDialog } from "./AddStaffDialog";
import { StaffCard } from "./StaffCard";

type StaffSearchListProps = {
  title: ReactNode;
  list: StaffList;
  existingEmails: string[];
};

const NEW_STAFF_TONES: AvatarTone[] = [
  "blue",
  "pink",
  "green",
  "yellow",
  "purple",
];

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

export function StaffSearchList({
  title,
  list,
  existingEmails,
}: StaffSearchListProps) {
  const [query, setQuery] = useState("");
  // Staff agregado en esta sesión: estado local, sin persistir
  const [added, setAdded] = useState<StaffListItem[]>([]);
  const [addedEmails, setAddedEmails] = useState<string[]>([]);
  const idPrefix = useId();

  function addStaff(input: NewStaffInput) {
    const tone = NEW_STAFF_TONES[added.length % NEW_STAFF_TONES.length];
    const item = buildNewStaffItem(input, `${idPrefix}-${added.length}`, tone);
    setAdded((current) => [...current, item]);
    setAddedEmails((current) => [...current, input.email]);
  }

  const fullList: StaffList = { ...list, pending: [...list.pending, ...added] };
  const normalizedQuery = normalizeSearch(query.trim());
  const matchesQuery = (item: StaffListItem) =>
    normalizeSearch(item.fullName).includes(normalizedQuery);
  const visible = {
    active: fullList.active.filter(matchesQuery),
    pending: fullList.pending.filter(matchesQuery),
    archived: fullList.archived.filter(matchesQuery),
  };
  const hasAnyItem =
    fullList.active.length +
      fullList.pending.length +
      fullList.archived.length >
    0;
  const hasAnyMatch =
    visible.active.length + visible.pending.length + visible.archived.length >
    0;

  return (
    <>
      <header className="mb-[22px] flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
        {title}
        <AddStaffDialog
          existingEmails={[...existingEmails, ...addedEmails]}
          onAdd={addStaff}
        />
      </header>
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
