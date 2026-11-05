import Link from "next/link";
import { PlusIcon } from "@/shared/components/icons/PlusIcon";
import { buildElderlyList } from "../build-elderly-list";
import type { ElderlySource } from "../types";
import { ElderlySearchList } from "./ElderlySearchList";

type ElderlyListViewProps = {
  source: ElderlySource;
};

export function ElderlyListView({ source }: ElderlyListViewProps) {
  const items = buildElderlyList(source);

  return (
    <div className="mx-auto w-full max-w-[880px] px-4 pt-5 pb-8 lg:px-10 lg:pt-[34px] lg:pb-20">
      <header className="mb-[22px] flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
        <div>
          <div className="mb-1 text-[12.5px] font-extrabold tracking-[0.8px] text-coral-strong">
            GESTIÓN
          </div>
          <h1 className="m-0 font-display text-2xl leading-[normal] font-semibold text-ink lg:text-[30px]">
            Adultos mayores
          </h1>
        </div>
        <Link
          href="/"
          className="flex items-center gap-2 whitespace-nowrap rounded-[14px] bg-linear-to-b from-[#F4977E] to-[#EE8164] px-[18px] py-[11px] text-[14.5px] font-extrabold text-white shadow-[0_8px_18px_-8px_rgba(238,129,100,0.7)]"
        >
          <PlusIcon size={17} />
          Agregar adulto mayor
        </Link>
      </header>
      <ElderlySearchList items={items} />
    </div>
  );
}
