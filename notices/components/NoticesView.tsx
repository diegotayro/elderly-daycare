import type { Notice } from "../types";

type NoticesViewProps = {
  notices: Notice[];
};

export function NoticesView(_props: NoticesViewProps) {
  return (
    <div className="mx-auto w-full max-w-[680px] px-4 pt-5 pb-8 lg:px-10 lg:pt-[34px] lg:pb-20">
      <header className="mb-[22px]">
        <div className="mb-1 text-[12.5px] font-extrabold tracking-[0.8px] text-coral-strong">
          ACTIVIDAD
        </div>
        <h1 className="m-0 font-display text-2xl leading-[normal] lg:text-[30px] font-semibold text-ink">
          Avisos
        </h1>
      </header>
    </div>
  );
}
