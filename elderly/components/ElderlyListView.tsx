import { buildElderlyList } from "../build-elderly-list";
import { buildRoomOptions } from "../build-room-options";
import type { ElderlySource } from "../types";
import { AddElderlyDialog } from "./AddElderlyDialog";
import { ElderlyListTitle } from "./ElderlyListTitle";
import { ElderlySearchList } from "./ElderlySearchList";

type ElderlyListViewProps = {
  source: ElderlySource;
  canAddElderly: boolean;
  includeArchived: boolean;
};

export function ElderlyListView({
  source,
  canAddElderly,
  includeArchived,
}: ElderlyListViewProps) {
  const list = buildElderlyList(source, { includeArchived });

  return (
    <div className="mx-auto w-full max-w-[880px] px-4 pt-5 pb-8 lg:px-10 lg:pt-[34px] lg:pb-20">
      <header className="mb-[22px] flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
        <ElderlyListTitle />
        {canAddElderly && (
          <AddElderlyDialog
            rooms={buildRoomOptions(source)}
            today={source.referenceDate}
          />
        )}
      </header>
      <ElderlySearchList list={list} />
    </div>
  );
}
