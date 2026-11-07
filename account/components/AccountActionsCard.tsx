import { ChevronRightIcon } from "@/shared/components/icons/ChevronRightIcon";

const actionLabels = ["Cambiar contraseña", "Ayuda y soporte"];

export function AccountActionsCard() {
  return (
    <section className="mb-[18px] overflow-hidden rounded-[18px] border border-line bg-surface">
      {actionLabels.map((label) => (
        <button
          key={label}
          type="button"
          className="flex w-full cursor-pointer items-center justify-between border-b border-line-soft px-[22px] py-4 text-left last:border-b-0 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-coral-strong"
        >
          <span className="text-[15px] font-semibold text-body">{label}</span>
          <ChevronRightIcon size={18} className="flex-none text-chevron" />
        </button>
      ))}
    </section>
  );
}
