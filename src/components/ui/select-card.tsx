import * as React from "react"
import { cn } from "@/lib/utils"
import { Check } from "lucide-react"

interface SelectCardProps extends React.HTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export function SelectCard({
  className,
  selected = false,
  title,
  description,
  icon,
  disabled,
  ...props
}: SelectCardProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      disabled={disabled}
      className={cn(
        "group relative w-full text-left rounded-2xl border-2 p-4 transition-brand",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vitality focus-visible:ring-offset-2 focus-visible:ring-offset-warm-white",
        "disabled:opacity-50 disabled:pointer-events-none",
        selected
          ? "border-vitality bg-vitality/10 shadow-sm"
          : "border-forest/10 bg-white hover:border-forest/25 hover:-translate-y-0.5",
        className
      )}
      {...(props as React.ButtonHTMLAttributes<HTMLButtonElement>)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          {icon && (
            <div
              className={cn(
                "shrink-0 grid place-items-center w-9 h-9 rounded-xl transition-brand",
                selected ? "bg-vitality text-forest" : "bg-forest/5 text-forest group-hover:bg-forest/10"
              )}
            >
              {icon}
            </div>
          )}
          <div className="min-w-0">
            <h3 className="font-semibold text-forest leading-tight">{title}</h3>
            {description && (
              <p className="text-sm text-muted mt-1 leading-snug">{description}</p>
            )}
          </div>
        </div>
        <div
          className={cn(
            "shrink-0 grid place-items-center w-6 h-6 rounded-full border-2 transition-brand",
            selected ? "bg-vitality border-vitality" : "border-forest/20"
          )}
          aria-hidden
        >
          {selected && <Check className="w-3.5 h-3.5 text-forest" strokeWidth={3} />}
        </div>
      </div>
    </button>
  )
}
