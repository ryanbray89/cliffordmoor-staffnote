import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function ChoiceChip({
  pressed,
  onClick,
  children,
}: {
  pressed: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={cn(
        "inline-flex min-h-12 max-w-full items-center rounded-full px-4 py-2 text-left text-base font-semibold",
        pressed ? "bg-primary text-primary-foreground" : "bg-card text-foreground ring-1 ring-border",
      )}
    >
      {children}
    </button>
  );
}
