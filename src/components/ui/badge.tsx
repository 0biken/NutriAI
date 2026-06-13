import * as React from "react";
import { cn } from "@/lib/utils";

export type BadgeVariant =
  | "neutral"
  | "vitality"
  | "pcos"
  | "luteal"
  | "pregnancy"
  | "clinical"
  | "budget"
  | "suya"
  | "dark";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  icon?: React.ReactNode;
}

const STYLES: Record<BadgeVariant, string> = {
  neutral:   "bg-forest/5 text-forest border border-forest/10",
  vitality:  "bg-vitality/25 text-forest",
  pcos:      "bg-pcos-bg text-pcos-fg",
  luteal:    "bg-luteal-bg text-luteal-fg",
  pregnancy: "bg-pregnancy-bg text-pregnancy-fg",
  clinical:  "bg-clinical-bg text-clinical-fg",
  budget:    "bg-budget-bg text-budget-fg",
  suya:      "bg-suya/15 text-suya",
  dark:      "bg-forest text-vitality",
};

export function Badge({ variant = "neutral", icon, className, children, ...rest }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold tracking-wide whitespace-nowrap",
        STYLES[variant],
        className
      )}
      {...rest}
    >
      {icon}
      {children}
    </span>
  );
}
