import type { ComponentType } from "react";
import type { IconProps } from "@/shared/components/icons/Icon";

type SummaryStatCardProps = {
  icon: ComponentType<IconProps>;
  value: string;
  label: string;
  bgClassName: string;
  color: string;
};

export function SummaryStatCard({
  icon: Icon,
  value,
  label,
  bgClassName,
  color,
}: SummaryStatCardProps) {
  return (
    <div
      className={`rounded-[18px] px-2 py-4 text-center lg:p-5 ${bgClassName}`}
      style={{ color }}
    >
      <Icon size={26} className="mx-auto mb-3.5" />
      <div className="font-display text-2xl leading-[normal] font-semibold lg:text-[26px]">
        {value}
      </div>
      <div className="text-[13px] font-semibold">{label}</div>
    </div>
  );
}
