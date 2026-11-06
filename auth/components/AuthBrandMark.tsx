import { SunIcon } from "@/shared/components/icons/SunIcon";

type AuthBrandMarkProps = {
  className?: string;
};

export function AuthBrandMark({ className = "" }: AuthBrandMarkProps) {
  return (
    <div
      className={`flex size-[58px] items-center justify-center rounded-[18px] bg-linear-155 from-[#F8C3A8] to-coral text-white shadow-[0_12px_26px_-10px_rgba(238,129,100,0.65)] ${className}`}
    >
      <SunIcon size={30} />
    </div>
  );
}
