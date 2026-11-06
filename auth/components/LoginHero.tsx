import { SunIcon } from "@/shared/components/icons/SunIcon";

export function LoginHero() {
  return (
    <div className="relative flex flex-col justify-between overflow-hidden bg-linear-155 from-[#F6A98E] via-coral via-45% to-[#EC7E62] px-[60px] py-14 text-white">
      <div className="absolute -top-[140px] -right-[120px] size-[420px] rounded-full bg-white/12" />
      <div className="absolute -bottom-[110px] -left-20 size-[300px] rounded-full bg-white/10" />

      <div className="relative flex items-center gap-[13px]">
        <div className="flex size-[46px] items-center justify-center rounded-[14px] bg-white/22">
          <SunIcon size={26} />
        </div>
        <span className="font-display text-[21px] font-semibold tracking-[0.5px]">
          Casa Nogal
        </span>
      </div>

      <div className="relative">
        <h1 className="mb-[18px] font-display text-[42px] leading-[1.12] font-semibold">
          El día de cada adulto mayor,
          <br />
          compartido con su familia.
        </h1>
        <p className="max-w-[430px] text-[17px] leading-[1.6] text-white/92">
          Publica momentos y mantén a las familias cerca, desde un solo lugar.
        </p>
      </div>

      <div className="relative text-sm text-white/90">
        🌿 Guardería Casa Nogal
      </div>
    </div>
  );
}
