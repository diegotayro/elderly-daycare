"use client";

import { useState } from "react";

type NotificationToggleProps = {
  label: string;
  initialEnabled: boolean;
};

export function NotificationToggle({
  label,
  initialEnabled,
}: NotificationToggleProps) {
  const [enabled, setEnabled] = useState(initialEnabled);

  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={() => setEnabled((current) => !current)}
      className="flex w-full cursor-pointer items-center justify-between gap-4 border-b border-line-soft py-2 text-left last:border-b-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral-strong"
    >
      <span className="text-[15px] text-body">{label}</span>
      <span
        aria-hidden="true"
        className={`relative h-6 w-[42px] flex-none rounded-full transition-colors duration-200 motion-reduce:transition-none ${enabled ? "bg-consent-check" : "bg-toggle-off"}`}
      >
        <span
          className={`absolute top-[3px] left-[3px] size-[18px] rounded-full bg-white transition-transform duration-200 motion-reduce:transition-none ${enabled ? "translate-x-[18px]" : "translate-x-0"}`}
        />
      </span>
    </button>
  );
}
