import { ChevronRightIcon } from "@/shared/components/icons/ChevronRightIcon";
import type { ElderlyIndicator } from "../types";

type ElderlyCardIndicatorProps = {
  indicator: ElderlyIndicator;
};

const badgeClassName =
  "flex-none rounded-full px-[9px] py-[5px] text-[11px] font-extrabold";

export function ElderlyCardIndicator({ indicator }: ElderlyCardIndicatorProps) {
  switch (indicator.kind) {
    case "allergy":
      return (
        <span className={`${badgeClassName} bg-[#FBD8CC] text-[#D9684A]`}>
          {indicator.label}
        </span>
      );
    case "link":
      return (
        <span className={`${badgeClassName} bg-[#F9D2DE] text-[#C56486]`}>
          VINCULAR
        </span>
      );
    case "none":
      return (
        <ChevronRightIcon size={18} className="flex-none text-[#CBB89F]" />
      );
  }
}
