import Link from "next/link";

export default function ElderlyNotFound() {
  return (
    <div className="mx-auto w-full max-w-[820px] px-4 pt-5 pb-8 lg:px-10 lg:pt-[34px] lg:pb-20">
      <h1 className="m-0 mb-2 font-display text-[28px] leading-[normal] font-semibold text-ink">
        No encontramos a este adulto mayor
      </h1>
      <p className="mb-5 text-[15px] text-muted-strong">
        Puede que el enlace sea incorrecto o que ya no esté activo.
      </p>
      <Link
        href="/elderly"
        className="text-[14.5px] font-extrabold text-coral-link"
      >
        Volver a Adultos mayores
      </Link>
    </div>
  );
}
